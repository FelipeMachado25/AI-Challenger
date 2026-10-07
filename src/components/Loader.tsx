"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { HATS } from "@/lib/hats";
import type { HatId } from "@/lib/types";

interface LoaderProps {
  hats: HatId[];
}

const PHASES = ["Reading the idea…", "Applying the lenses…", "Hunting for blind spots…", "Drafting uncomfortable questions…"];

export function Loader({ hats }: LoaderProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const id = window.setInterval(() => setElapsed(performance.now() - start), 100);
    return () => window.clearInterval(id);
  }, []);

  const phase = PHASES[Math.min(PHASES.length - 1, Math.floor(elapsed / 700))];

  return (
    <div role="status" aria-live="polite" className="panel grid-noise flex flex-col items-center gap-6 px-6 py-12 text-center">
      <div className="flex items-end gap-3">
        {hats.map((id, i) => (
          <motion.div
            key={id}
            className="grid h-12 w-12 place-items-center rounded-2xl border text-2xl"
            style={{ borderColor: HATS[id].color, boxShadow: `0 0 24px ${HATS[id].glow}`, background: "rgba(9,9,11,0.8)" }}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
          >
            <span aria-hidden>{HATS[id].emoji}</span>
          </motion.div>
        ))}
      </div>
      <div className="space-y-1">
        <p className="shimmer-text text-lg font-semibold">{phase}</p>
        <p className="font-mono text-xs text-zinc-500">{(elapsed / 1000).toFixed(1)}s · Groq LPU</p>
      </div>
      <span className="sr-only">Analyzing with {hats.length} hats</span>
    </div>
  );
}

export function CardSkeleton({ color }: { color: string }) {
  return (
    <div className="panel space-y-4 p-5" style={{ borderColor: `${color}33` }}>
      <div className="h-5 w-1/3 animate-pulse rounded bg-white/10" />
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-white/5" />
        <div className="h-3 w-5/6 animate-pulse rounded bg-white/5" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full animate-pulse rounded bg-white/5" />
        <div className="h-3 w-4/6 animate-pulse rounded bg-white/5" />
      </div>
    </div>
  );
}
