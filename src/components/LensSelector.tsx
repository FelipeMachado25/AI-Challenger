"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { HAT_LIST } from "@/lib/hats";
import type { HatId } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LensSelectorProps {
  selected: HatId[];
  onChange: (selected: HatId[]) => void;
  disabled?: boolean;
}

export function LensSelector({ selected, onChange, disabled }: LensSelectorProps) {
  const allSelected = selected.length === HAT_LIST.length;

  const toggle = (id: HatId) => {
    if (selected.includes(id)) {
      onChange(selected.filter((h) => h !== id));
    } else {
      // Keep the canonical hat order.
      onChange(HAT_LIST.map((h) => h.id).filter((h) => h === id || selected.includes(h)));
    }
  };

  return (
    <section className="panel p-4 sm:p-6" aria-labelledby="lens-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="lens-title" className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
          2 · Choose your hats
        </h2>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(allSelected ? [] : HAT_LIST.map((h) => h.id))}
          className="focus-ring rounded-lg px-2 py-1 text-xs font-medium text-zinc-400 transition hover:text-white"
        >
          {allSelected ? "None" : "All"}
        </button>
      </div>

      <div role="group" aria-label="Strategic hats" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
        {HAT_LIST.map((hat) => {
          const active = selected.includes(hat.id);
          return (
            <motion.button
              key={hat.id}
              type="button"
              role="switch"
              aria-checked={active}
              disabled={disabled}
              onClick={() => toggle(hat.id)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "focus-ring group relative flex min-h-[96px] flex-col items-start gap-1.5 overflow-hidden rounded-xl border p-4 text-left transition-all duration-200",
                active ? "bg-zinc-900" : "border-white/[0.07] bg-black/30 hover:border-white/15 hover:bg-white/[0.02]",
                disabled && "opacity-60",
              )}
              style={
                active
                  ? {
                      borderColor: hat.color,
                      boxShadow: `0 0 0 1px ${hat.color}55, 0 0 28px -4px ${hat.glow}, inset 0 0 40px -20px ${hat.glow}`,
                    }
                  : undefined
              }
            >
              <span
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300"
                style={{ background: hat.color, opacity: active ? 0.22 : 0 }}
                aria-hidden
              />
              <div className="flex w-full items-center justify-between">
                <span className="text-2xl leading-none" aria-hidden>
                  {hat.emoji}
                </span>
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full border transition-all",
                    active ? "scale-100" : "scale-90 border-white/15",
                  )}
                  style={active ? { background: hat.color, borderColor: hat.color } : undefined}
                  aria-hidden
                >
                  {active && <Check className="h-3 w-3 text-zinc-950" strokeWidth={3.5} />}
                </span>
              </div>
              <span className="text-[15px] font-semibold text-white">{hat.name}</span>
              <span className="text-xs font-medium" style={{ color: active ? hat.color : "#71717a" }}>
                {hat.tagline}
              </span>
              <span className="text-xs leading-snug text-zinc-500">{hat.focus}</span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
