import Groq from "groq-sdk";
import { NextResponse } from "next/server";

import {
  describeGroqError,
  getGroqClient,
  hasGroqApiKey,
  MissingApiKeyError,
  runHat,
  runHatsCombined,
} from "@/lib/groq";
import {
  isHatId,
  LIMITS,
  type ApiErrorCode,
  type ChallengeApiError,
  type ChallengeApiSuccess,
  type ChallengeRequest,
  type HatId,
  type HatResult,
  type InputMode,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;

function errorResponse(status: number, code: ApiErrorCode, message: string) {
  return NextResponse.json<ChallengeApiError>({ error: { code, message } }, { status });
}

/** Health check: reports whether the server has the key configured (without exposing it). */
export async function GET() {
  return NextResponse.json({ configured: hasGroqApiKey() }, { headers: { "Cache-Control": "no-store" } });
}

type Validated =
  | { ok: true; value: Required<Pick<ChallengeRequest, "mode" | "hats">> & ChallengeRequest }
  | { ok: false; status: number; code: ApiErrorCode; message: string };

function validate(body: unknown): Validated {
  if (typeof body !== "object" || body === null) {
    return { ok: false, status: 400, code: "BAD_REQUEST", message: "The request body must be a JSON object." };
  }
  const b = body as Record<string, unknown>;
  const mode = b.mode as InputMode;
  if (mode !== "text" && mode !== "image") {
    return { ok: false, status: 400, code: "BAD_REQUEST", message: "The 'mode' field must be 'text' or 'image'." };
  }

  const hatsRaw = Array.isArray(b.hats) ? b.hats : [];
  const hats = Array.from(new Set(hatsRaw.filter(isHatId))) as HatId[];
  if (hats.length === 0) {
    return { ok: false, status: 400, code: "BAD_REQUEST", message: "Select at least one hat." };
  }

  const text = typeof b.text === "string" ? b.text.trim() : undefined;
  if (text && text.length > LIMITS.maxTextChars) {
    return { ok: false, status: 413, code: "PAYLOAD_TOO_LARGE", message: `Text exceeds ${LIMITS.maxTextChars} characters.` };
  }

  if (mode === "text") {
    if (!text || text.length < 10) {
      return { ok: false, status: 400, code: "BAD_REQUEST", message: "Describe the idea in at least 10 characters." };
    }
    return { ok: true, value: { mode, hats, text } };
  }

  const image = typeof b.image === "string" ? b.image : "";
  if (!image) {
    return { ok: false, status: 400, code: "BAD_REQUEST", message: "Attach a photo of the board." };
  }
  if (image.length > LIMITS.maxImageDataUrlBytes) {
    return { ok: false, status: 413, code: "PAYLOAD_TOO_LARGE", message: "The image is too large. Try another photo." };
  }
  if (!IMAGE_DATA_URL.test(image)) {
    return { ok: false, status: 400, code: "BAD_REQUEST", message: "Invalid image format (use PNG, JPG, WEBP or GIF)." };
  }
  return { ok: true, value: { mode, hats, text, image } };
}

/** Maps a request-level Groq failure to an HTTP response. */
function upstreamFailure(error: unknown) {
  if (error instanceof Groq.AuthenticationError) {
    return errorResponse(
      401,
      "INVALID_API_KEY",
      "Groq rejected the configured GROQ_API_KEY. Check that it is valid and active at console.groq.com/keys.",
    );
  }
  const message = describeGroqError(error);
  console.error(`[api/challenge] failed: ${message}`);
  if (error instanceof Groq.RateLimitError) return errorResponse(429, "RATE_LIMITED", message);
  return errorResponse(502, "UPSTREAM_ERROR", message);
}

export async function POST(request: Request) {
  // 1. Credentials: explicit, readable failure if the key is missing.
  let client: Groq;
  try {
    client = getGroqClient();
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return errorResponse(
        401,
        "MISSING_API_KEY",
        "GROQ_API_KEY is not configured on the server. Add it to .env.local (development) or in Vercel → Settings → Environment Variables (production), then redeploy.",
      );
    }
    return errorResponse(500, "INTERNAL_ERROR", "Could not initialize the AI client.");
  }

  // 2. Parse and validate the payload.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "BAD_REQUEST", "Invalid JSON.");
  }
  const validated = validate(body);
  if (!validated.ok) return errorResponse(validated.status, validated.code, validated.message);
  const { mode, hats, text, image } = validated.value;

  // 3. Run the analysis.
  const started = Date.now();
  try {
    let results: HatResult[];

    if (mode === "image" && image) {
      // Image: one combined request so the photo's tokens are only paid once.
      try {
        const out = await runHatsCombined(client, { hats, text, image });
        const latencyMs = Date.now() - started;
        results = hats.map((hatId): HatResult => {
          const challenge = out.challenges[hatId];
          return challenge
            ? { hatId, ok: true, challenge, model: out.model, latencyMs }
            : { hatId, ok: false, error: "The model skipped this hat. Try analyzing again." };
        });
      } catch (error) {
        return upstreamFailure(error);
      }
    } else {
      // Text: one small request per hat, in parallel.
      const settled = await Promise.allSettled(
        hats.map(async (hatId) => {
          const t0 = Date.now();
          const out = await runHat(client, { hatId, mode, text });
          return { hatId, ...out, latencyMs: Date.now() - t0 };
        }),
      );

      const rejections = settled
        .filter((s): s is PromiseRejectedResult => s.status === "rejected")
        .map((s) => s.reason as unknown);

      if (rejections.some((e) => e instanceof Groq.AuthenticationError)) {
        return upstreamFailure(rejections.find((e) => e instanceof Groq.AuthenticationError));
      }
      if (rejections.length === settled.length && rejections.every((e) => e instanceof Groq.RateLimitError)) {
        return upstreamFailure(rejections[0]);
      }

      results = settled.map((s, i) => {
        const hatId = hats[i] as HatId;
        if (s.status === "fulfilled") {
          return { hatId, ok: true, challenge: s.value.challenge, model: s.value.model, latencyMs: s.value.latencyMs };
        }
        const message = describeGroqError(s.reason);
        console.error(`[api/challenge] hat=${hatId} failed: ${message}`);
        return { hatId, ok: false, error: message };
      });
    }

    if (results.every((r) => !r.ok)) {
      const first = results[0];
      return errorResponse(502, "UPSTREAM_ERROR", first && !first.ok ? first.error : "Groq could not process the request.");
    }

    return NextResponse.json<ChallengeApiSuccess>(
      { results, totalLatencyMs: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/challenge] unexpected error:", error instanceof Error ? error.message : error);
    return errorResponse(500, "INTERNAL_ERROR", "Internal error while processing the challenge.");
  }
}
