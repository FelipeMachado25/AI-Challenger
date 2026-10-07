import type { HatId } from "./types";

/** Visual metadata for each hat (safe for the client). */
export interface HatMeta {
  id: HatId;
  emoji: string;
  name: string;
  tagline: string;
  focus: string;
  color: string;
  /** rgba of the color for glows/shadows. */
  glow: string;
}

export const HATS: Record<HatId, HatMeta> = {
  cynic: {
    id: "cynic",
    emoji: "🏴‍☠️",
    name: "The Cynic",
    tagline: "Risk & friction",
    focus: "Security, adoption, finances and why it will fail.",
    color: "#f43f5e",
    glow: "rgba(244, 63, 94, 0.35)",
  },
  scaler: {
    id: "scaler",
    emoji: "🚀",
    name: "The Scaler",
    tagline: "Growth & 10x ambition",
    focus: "Lack of scale, how to multiply by 10 and break barriers.",
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.35)",
  },
  client: {
    id: "client",
    emoji: "👿",
    name: "The Difficult Customer",
    tagline: "Empathy & skepticism",
    focus: "The laziest, cheapest, most demanding user. Why would they pay?",
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.35)",
  },
  operator: {
    id: "operator",
    emoji: "⚙️",
    name: "The Realist Operator",
    tagline: "Feasibility & execution",
    focus: "Technical complexity, dependencies, timelines and bottlenecks.",
    color: "#06b6d4",
    glow: "rgba(6, 182, 212, 0.35)",
  },
};

export const HAT_LIST: HatMeta[] = [HATS.cynic, HATS.scaler, HATS.client, HATS.operator];
