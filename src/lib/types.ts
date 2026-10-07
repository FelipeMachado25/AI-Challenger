/**
 * Tipos compartidos entre cliente y servidor.
 * Este archivo NO debe contener secretos ni lógica de servidor.
 */

export type InputMode = "text" | "image";

export type HatId = "cynic" | "scaler" | "client" | "operator";

export const HAT_IDS: readonly HatId[] = ["cynic", "scaler", "client", "operator"] as const;

/** Estructura JSON que el modelo debe devolver para cada sombrero. */
export interface ChallengeResponse {
  blindspot: string;
  fatalHypothesis: string;
  /** Exactamente 2 preguntas. */
  uncomfortableQuestions: [string, string];
  pivotSignal: string;
}

/** Payload que el cliente envía a /api/challenge. */
export interface ChallengeRequest {
  mode: InputMode;
  hats: HatId[];
  /** Texto de la idea (mode === "text") o contexto opcional (mode === "image"). */
  text?: string;
  /** Data URL Base64 de la imagen (mode === "image"). */
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

/** Límites compartidos para validar antes de enviar y en el servidor. */
export const LIMITS = {
  maxTextChars: 4000,
  /** Tamaño máximo del data URL Base64 (Groq acepta hasta ~4 MB en base64). */
  maxImageDataUrlBytes: 3_800_000,
  maxImageDimension: 1600,
} as const;

/** Type guard para validar la respuesta del modelo. */
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
