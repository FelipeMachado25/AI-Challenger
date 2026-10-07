"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { AlertTriangle, Check, Copy, Eye, HelpCircle, RefreshCw, Signpost, Skull } from "lucide-react";
import { useState } from "react";

import { HATS } from "@/lib/hats";
import type { ChallengeResponse, HatResult } from "@/lib/types";

interface ChallengeCardsProps {
  results: HatResult[];
  totalLatencyMs: number;
  onReanalyze: () => void;
  loading?: boolean;
}

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

function formatChallenge(name: string, c: ChallengeResponse): string {
  return [
    `【${name}】`,
    `• Punto ciego: ${c.blindspot}`,
    `• Hipótesis fatal: ${c.fatalHypothesis}`,
    `• Preguntas incómodas:`,
    `   1. ${c.uncomfortableQuestions[0]}`,
    `   2. ${c.uncomfortableQuestions[1]}`,
    `• Señal de pivote: ${c.pivotSignal}`,
  ].join("\n");
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function CopyButton({ getText, label, accent }: { getText: () => string; label: string; accent?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyText(getText());
        setState(ok ? "copied" : "error");
        window.setTimeout(() => setState("idle"), 1600);
      }}
      className="focus-ring flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
      aria-label={label}
    >
      {state === "copied" ? (
        <Check className="h-3.5 w-3.5" style={{ color: accent ?? "#34d399" }} />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {state === "copied" ? "Copiado" : state === "error" ? "Error" : "Copiar"}
    </button>
  );
}

function Section({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: typeof Eye;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color }}>
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {title}
      </div>
      <div className="text-[15px] leading-relaxed text-zinc-200">{children}</div>
    </div>
  );
}

export function ChallengeCards({ results, totalLatencyMs, onReanalyze, loading }: ChallengeCardsProps) {
  const okResults = results.filter((r) => r.ok);

  const allText = () =>
    okResults.map((r) => (r.ok ? formatChallenge(`${HATS[r.hatId].emoji} ${HATS[r.hatId].name}`, r.challenge) : "")).join("\n\n");

  return (
    <section aria-labelledby="results-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="results-title" className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
            3 · Tarjetas de desafío
          </h2>
          <p className="mt-1 font-mono text-xs text-zinc-600">
            {okResults.length} visor{okResults.length === 1 ? "" : "es"} · {(totalLatencyMs / 1000).toFixed(2)}s
          </p>
        </div>
        <div className="flex gap-2">
          {okResults.length > 0 && <CopyButton getText={allText} label="Copiar todas las tarjetas" />}
          <button
            type="button"
            onClick={onReanalyze}
            disabled={loading}
            className="focus-ring flex min-h-[40px] items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
          >
            <RefreshCw className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            Volver a analizar
          </button>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnimatePresence>
          {results.map((result) => {
            const hat = HATS[result.hatId];
            return (
              <motion.article
                key={result.hatId}
                variants={card}
                layout
                className="panel relative overflow-hidden"
                style={{ borderColor: `${hat.color}40`, boxShadow: `0 24px 60px -30px ${hat.glow}` }}
              >
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${hat.color}, transparent)` }} />
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
                  style={{ background: hat.color, opacity: 0.12 }}
                  aria-hidden
                />

                <header className="flex items-start justify-between gap-3 p-5 pb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-11 w-11 place-items-center rounded-xl border text-xl"
                      style={{ borderColor: `${hat.color}66`, background: `${hat.color}14` }}
                      aria-hidden
                    >
                      {hat.emoji}
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-white">{hat.name}</h3>
                      <p className="text-xs" style={{ color: hat.color }}>
                        {hat.tagline}
                      </p>
                    </div>
                  </div>
                  {result.ok && (
                    <CopyButton
                      getText={() => formatChallenge(`${hat.emoji} ${hat.name}`, result.challenge)}
                      label={`Copiar tarjeta de ${hat.name}`}
                      accent={hat.color}
                    />
                  )}
                </header>

                {result.ok ? (
                  <div className="space-y-5 p-5 pt-2">
                    <Section icon={Eye} title="Punto ciego" color={hat.color}>
                      {result.challenge.blindspot}
                    </Section>
                    <Section icon={Skull} title="Hipótesis fatal" color={hat.color}>
                      {result.challenge.fatalHypothesis}
                    </Section>
                    <Section icon={HelpCircle} title="Preguntas incómodas" color={hat.color}>
                      <ol className="space-y-2">
                        {result.challenge.uncomfortableQuestions.map((q, i) => (
                          <li key={i} className="flex gap-3">
                            <span
                              className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md font-mono text-[11px] font-bold text-zinc-950"
                              style={{ background: hat.color }}
                            >
                              {i + 1}
                            </span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ol>
                    </Section>
                    <div className="rounded-xl border border-white/[0.06] bg-black/40 p-4">
                      <Section icon={Signpost} title="Señal de pivote" color={hat.color}>
                        {result.challenge.pivotSignal}
                      </Section>
                    </div>
                    <p className="text-right font-mono text-[10px] text-zinc-600">
                      {result.model} · {(result.latencyMs / 1000).toFixed(2)}s
                    </p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 p-5 pt-2 text-sm text-zinc-400">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
                    <span>{result.error}</span>
                  </div>
                )}
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
