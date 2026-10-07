import Groq from "groq-sdk";
import { NextResponse } from "next/server";

import { getGroqClient, hasGroqApiKey, InvalidModelOutputError, MissingApiKeyError, runHat } from "@/lib/groq";
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
export const maxDuration = 30;

const IMAGE_DATA_URL = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/;

function errorResponse(status: number, code: ApiErrorCode, message: string) {
  return NextResponse.json<ChallengeApiError>({ error: { code, message } }, { status });
}

/** Health check: indica si el servidor tiene la clave configurada (sin exponerla). */
export async function GET() {
  return NextResponse.json({ configured: hasGroqApiKey() }, { headers: { "Cache-Control": "no-store" } });
}

type Validated = { ok: true; value: Required<Pick<ChallengeRequest, "mode" | "hats">> & ChallengeRequest } | { ok: false; status: number; code: ApiErrorCode; message: string };

function validate(body: unknown): Validated {
  if (typeof body !== "object" || body === null) {
    return { ok: false, status: 400, code: "BAD_REQUEST", message: "El cuerpo de la petición debe ser un objeto JSON." };
  }
  const b = body as Record<string, unknown>;
  const mode = b.mode as InputMode;
  if (mode !== "text" && mode !== "image") {
    return { ok: false, status: 400, code: "BAD_REQUEST", message: "El campo 'mode' debe ser 'text' o 'image'." };
  }

  const hatsRaw = Array.isArray(b.hats) ? b.hats : [];
  const hats = Array.from(new Set(hatsRaw.filter(isHatId))) as HatId[];
  if (hats.length === 0) {
    return { ok: false, status: 400, code: "BAD_REQUEST", message: "Selecciona al menos un sombrero." };
  }

  const text = typeof b.text === "string" ? b.text.trim() : undefined;
  if (text && text.length > LIMITS.maxTextChars) {
    return { ok: false, status: 413, code: "PAYLOAD_TOO_LARGE", message: `El texto supera ${LIMITS.maxTextChars} caracteres.` };
  }

  if (mode === "text") {
    if (!text || text.length < 10) {
      return { ok: false, status: 400, code: "BAD_REQUEST", message: "Describe la idea con al menos 10 caracteres." };
    }
    return { ok: true, value: { mode, hats, text } };
  }

  const image = typeof b.image === "string" ? b.image : "";
  if (!image) {
    return { ok: false, status: 400, code: "BAD_REQUEST", message: "Adjunta una imagen del tablero." };
  }
  if (image.length > LIMITS.maxImageDataUrlBytes) {
    return { ok: false, status: 413, code: "PAYLOAD_TOO_LARGE", message: "La imagen es demasiado grande. Prueba con otra foto." };
  }
  if (!IMAGE_DATA_URL.test(image)) {
    return { ok: false, status: 400, code: "BAD_REQUEST", message: "Formato de imagen no válido (usa PNG, JPG, WEBP o GIF)." };
  }
  return { ok: true, value: { mode, hats, text, image } };
}

function describeHatError(error: unknown): string {
  if (error instanceof InvalidModelOutputError) return "El modelo devolvió un formato inválido. Vuelve a analizar.";
  if (error instanceof Groq.APIConnectionTimeoutError) return "Groq tardó demasiado en responder.";
  if (error instanceof Groq.APIConnectionError) return "No se pudo conectar con Groq.";
  if (error instanceof Groq.APIError) return `Groq respondió con un error (${error.status ?? "desconocido"}).`;
  return "Error inesperado al analizar con este sombrero.";
}

export async function POST(request: Request) {
  // 1. Credenciales: fallo explícito y legible si falta la clave.
  let client: Groq;
  try {
    client = getGroqClient();
  } catch (error) {
    if (error instanceof MissingApiKeyError) {
      return errorResponse(
        401,
        "MISSING_API_KEY",
        "Falta configurar GROQ_API_KEY en el servidor. Añádela en .env.local (desarrollo) o en Vercel → Settings → Environment Variables (producción).",
      );
    }
    return errorResponse(500, "INTERNAL_ERROR", "No se pudo inicializar el cliente de IA.");
  }

  // 2. Parseo y validación del payload.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "BAD_REQUEST", "JSON inválido.");
  }
  const validated = validate(body);
  if (!validated.ok) return errorResponse(validated.status, validated.code, validated.message);
  const { mode, hats, text, image } = validated.value;

  // 3. Ejecución en paralelo de cada sombrero.
  const started = Date.now();
  try {
    const settled = await Promise.allSettled(
      hats.map(async (hatId) => {
        const t0 = Date.now();
        const out = await runHat(client, { hatId, mode, text, image });
        return { hatId, ...out, latencyMs: Date.now() - t0 };
      }),
    );

    const rejections = settled.filter((s): s is PromiseRejectedResult => s.status === "rejected").map((s) => s.reason as unknown);

    if (rejections.some((e) => e instanceof Groq.AuthenticationError || e instanceof Groq.PermissionDeniedError)) {
      return errorResponse(
        401,
        "INVALID_API_KEY",
        "Groq rechazó la GROQ_API_KEY configurada. Verifica que sea válida y esté activa en console.groq.com/keys.",
      );
    }
    if (rejections.length === settled.length && rejections.every((e) => e instanceof Groq.RateLimitError)) {
      return errorResponse(429, "RATE_LIMITED", "Límite de peticiones de Groq alcanzado. Espera unos segundos e inténtalo de nuevo.");
    }

    const results: HatResult[] = settled.map((s, i) => {
      const hatId = hats[i] as HatId;
      if (s.status === "fulfilled") {
        return { hatId, ok: true, challenge: s.value.challenge, model: s.value.model, latencyMs: s.value.latencyMs };
      }
      console.error(`[api/challenge] hat=${hatId} failed:`, s.reason instanceof Error ? s.reason.message : s.reason);
      return { hatId, ok: false, error: describeHatError(s.reason) };
    });

    if (results.every((r) => !r.ok)) {
      return errorResponse(502, "UPSTREAM_ERROR", results[0] && !results[0].ok ? results[0].error : "Groq no pudo procesar la petición.");
    }

    return NextResponse.json<ChallengeApiSuccess>(
      { results, totalLatencyMs: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[api/challenge] unexpected error:", error instanceof Error ? error.message : error);
    return errorResponse(500, "INTERNAL_ERROR", "Error interno al procesar el desafío.");
  }
}
