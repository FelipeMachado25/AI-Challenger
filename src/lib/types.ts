/**
 * Types shared between client and server.
 * This file must NOT contain secrets or server logic.
 */

export type InputMode = "text" | "image";

export type HatId = "cynic" | "scaler" | "client" | "operator";

export const HAT_IDS: readonly HatId[] = ["cynic", "scaler", "client", "operator"] as const;

/** JSON structure the model must return for each hat. */
export interface ChallengeResponse {
  blindspot: string;
  fatalHypothesis: string;
  /** Exactly 2 questions. */
  uncomfortableQuestions: [string, string];
  pivotSignal: string;
}

/** Payload the client sends to /api/challenge. */
export interface ChallengeRequest {
  mode: InputMode;
  hats: HatId[];
  /** Idea text (mode === "text") or optional context (mode === "image"). */
  text?: string;
  /** Base64 data URL of the image (mode === "image"). */
  image?: string;
}

export interface HatResultOk {
  hatId: HatId;
  ok: true;
  challenge: ChallengeResponse;
  model: string;
  latencyMs: number;
}

export interface HatResultError {
  hatId: HatId;
  ok: false;
  error: string;
}

export type HatResult = HatResultOk | HatResultError;

export interface ChallengeApiSuccess {
  results: HatResult[];
  totalLatencyMs: number;
}

export type ApiErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_API_KEY"
  | "BAD_REQUEST"
  | "PAYLOAD_TOO_LARGE"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

export interface ChallengeApiError {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

/** Shared limits, validated before sending and on the server. */
export const LIMITS = {
  maxTextChars: 4000,
  /** Max Base64 data URL size (Groq accepts up to ~4 MB in base64). */
  maxImageDataUrlBytes: 3_800_000,
  maxImageDimension: 1280,
} as const;

/** Type guard that validates the model response. */
export function isChallengeResponse(value: unknown): value is ChallengeResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const q = v.uncomfortableQuestions;
  return (
    typeof v.blindspot === "string" &&
    v.blindspot.trim().length > 0 &&
    typeof v.fatalHypothesis === "string" &&
    v.fatalHypothesis.trim().length > 0 &&
    typeof v.pivotSignal === "string" &&
    v.pivotSignal.trim().length > 0 &&
    Array.isArray(q) &&
    q.length === 2 &&
    q.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

export function isHatId(value: unknown): value is HatId {
  return typeof value === "string" && (HAT_IDS as readonly string[]).includes(value);
}
