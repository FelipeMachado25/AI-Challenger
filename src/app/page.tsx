"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ApiKeyWarning } from "@/components/ApiKeyWarning";
import { ChallengeCards } from "@/components/ChallengeCards";
import { Header, type ConnectionStatus } from "@/components/Header";
import { InputSection } from "@/components/InputSection";
import { LensSelector } from "@/components/LensSelector";
import { Loader } from "@/components/Loader";
import { HATS } from "@/lib/hats";
import type { ChallengeApiError, ChallengeApiSuccess, ChallengeRequest, HatId, InputMode } from "@/lib/types";
import { cn } from "@/lib/utils";

type KeyWarning = { variant: "missing" | "invalid"; message?: string } | null;

export default function WorkshopPage() {
  const [mode, setMode] = useState<InputMode>("image");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [context, setContext] = useState("");
  const [hats, setHats] = useState<HatId[]>(["cynic", "client"]);

  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [loading, setLoading] = useState(false);
  const [loadingHats, setLoadingHats] = useState<HatId[]>([]);
  const [result, setResult] = useState<ChallengeApiSuccess | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [keyWarning, setKeyWarning] = useState<KeyWarning>(null);

  const abortRef = useRef<AbortController | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const checkConnection = useCallback(async () => {
    setStatus("checking");
    try {
      const res = await fetch("/api/challenge", { cache: "no-store" });
      const data = (await res.json()) as { configured?: boolean };
      if (data.configured) {
        setStatus("online");
        setKeyWarning(null);
      } else {
        setStatus("missing");
        setKeyWarning({ variant: "missing" });
      }
    } catch {
      setStatus("missing");
    }
  }, []);

  useEffect(() => {
    void checkConnection();
    return () => abortRef.current?.abort();
  }, [checkConnection]);

  const canSubmit =
    !loading && hats.length > 0 && (mode === "text" ? text.trim().length >= 10 : Boolean(image));

  const disabledReason =
    hats.length === 0
      ? "Selecciona al menos un sombrero"
      : mode === "text" && text.trim().length < 10
        ? "Escribe la idea (mín. 10 caracteres)"
        : mode === "image" && !image
          ? "Añade una foto del tablero"
          : null;

  const analyze = useCallback(async () => {
    if (!canSubmit) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const payload: ChallengeRequest =
      mode === "text"
        ? { mode, hats, text: text.trim() }
        : { mode, hats, image: image ?? undefined, text: context.trim() || undefined };

    setLoading(true);
    setLoadingHats(hats);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const data = (await res.json().catch(() => null)) as ChallengeApiSuccess | ChallengeApiError | null;

      if (!res.ok || !data || "error" in data) {
        const apiError = data && "error" in data ? data.error : null;
        if (res.status === 401 || apiError?.code === "MISSING_API_KEY" || apiError?.code === "INVALID_API_KEY") {
          setStatus("missing");
          setKeyWarning({
            variant: apiError?.code === "INVALID_API_KEY" ? "invalid" : "missing",
            message: apiError?.message,
          });
          return;
        }
        setError(apiError?.message ?? `Error inesperado (${res.status}). Inténtalo de nuevo.`);
        return;
      }

      setStatus("online");
      setResult(data);
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("No se pudo contactar con el servidor. Revisa tu conexión.");
    } finally {
      if (abortRef.current === controller) {
        setLoading(false);
        abortRef.current = null;
      }
    }
  }, [canSubmit, mode, hats, text, image, context]);

  const accent = hats[0] ? HATS[hats[0]].color : "#a1a1aa";

  return (
    <>
      <Header status={status} onStatusClick={() => setKeyWarning({ variant: "missing" })} />

      <main className="mx-auto max-w-6xl px-4 pb-36 pt-6 sm:px-6 sm:pt-10 lg:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 max-w-2xl"
        >
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-zinc-400">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" aria-hidden />
            Taller de estrategia · Respuesta en ~2s
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Pon tu idea contra las cuerdas.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-zinc-400">
            Fotografía el tablero o escribe la propuesta. Cada sombrero devuelve un punto ciego, una hipótesis fatal, dos
            preguntas incómodas y la señal que indicaría pivotar.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr]">
          <InputSection
            mode={mode}
            onModeChange={setMode}
            text={text}
            onTextChange={setText}
            image={image}
            onImageChange={setImage}
            context={context}
            onContextChange={setContext}
            disabled={loading}
            onSubmitShortcut={analyze}
          />
          <div className="flex flex-col gap-5">
            <LensSelector selected={hats} onChange={setHats} disabled={loading} />

            {/* Botón de análisis (escritorio) */}
            <AnalyzeButton
              className="hidden lg:flex"
              onClick={analyze}
              disabled={!canSubmit}
              loading={loading}
              accent={accent}
              hint={disabledReason}
              count={hats.length}
            />
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              role="alert"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" aria-hidden />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="focus-ring rounded p-1 text-amber-300 hover:text-white"
                aria-label="Cerrar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={resultsRef} className="scroll-mt-24 pt-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader hats={loadingHats} />
              </motion.div>
            ) : result ? (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ChallengeCards
                  results={result.results}
                  totalLatencyMs={result.totalLatencyMs}
                  onReanalyze={analyze}
                  loading={loading}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>

      {/* Barra de acción fija (móvil / tablet) */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-zinc-950/85 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl lg:hidden">
        <AnalyzeButton
          onClick={analyze}
          disabled={!canSubmit}
          loading={loading}
          accent={accent}
          hint={disabledReason}
          count={hats.length}
        />
      </div>

      <ApiKeyWarning
        open={keyWarning !== null}
        variant={keyWarning?.variant ?? "missing"}
        message={keyWarning?.message}
        onClose={() => setKeyWarning(null)}
        onRetry={() => void checkConnection()}
      />
    </>
  );
}

function AnalyzeButton({
  onClick,
  disabled,
  loading,
  accent,
  hint,
  count,
  className,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  accent: string;
  hint: string | null;
  count: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        className="focus-ring relative flex min-h-[56px] w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-white text-base font-semibold text-zinc-950 transition disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        style={disabled ? undefined : { boxShadow: `0 0 0 1px ${accent}, 0 12px 40px -8px ${accent}99` }}
      >
        <Sparkles className={cn("h-5 w-5", loading && "animate-spin")} aria-hidden />
        {loading ? "Desafiando…" : `Desafiar idea${count > 1 ? ` · ${count} sombreros` : ""}`}
      </motion.button>
      {hint && !loading && <p className="text-center text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
