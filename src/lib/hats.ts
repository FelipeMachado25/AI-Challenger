import type { HatId } from "./types";

/** Metadatos visuales de cada sombrero (seguros para el cliente). */
export interface HatMeta {
  id: HatId;
  emoji: string;
  name: string;
  tagline: string;
  focus: string;
  color: string;
  /** rgba del color para glows/sombras. */
  glow: string;
}

export const HATS: Record<HatId, HatMeta> = {
  cynic: {
    id: "cynic",
    emoji: "🏴‍☠️",
    name: "El Cínico",
    tagline: "Riesgo y fricción",
    focus: "Seguridad, adopción, finanzas y por qué fracasará.",
    color: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.35)",
  },
  scaler: {
    id: "scaler",
    emoji: "🚀",
    name: "El Escalador",
    tagline: "Crecimiento y ambición 10x",
    focus: "Falta de escala, cómo multiplicar por 10 y romper barreras.",
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.35)",
  },
  client: {
    id: "client",
    emoji: "👿",
    name: "El Cliente Incómodo",
    tagline: "Empatía y escepticismo",
    focus: "El usuario más perezoso, tacaño y exigente. ¿Por qué pagaría?",
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.35)",
  },
  operator: {
    id: "operator",
    emoji: "⚙️",
    name: "El Operador Realista",
    tagline: "Factibilidad y ejecución",
    focus: "Complejidad técnica, dependencias, plazos y cuellos de botella.",
    color: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.35)",
  },
};

export const HAT_LIST: HatMeta[] = [HATS.cynic, HATS.scaler, HATS.client, HATS.operator];
