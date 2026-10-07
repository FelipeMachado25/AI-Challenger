"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, KeyRound, X } from "lucide-react";
import { useEffect } from "react";

interface ApiKeyWarningProps {
  open: boolean;
  variant: "missing" | "invalid";
  message?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export function ApiKeyWarning({ open, variant, message, onClose, onRetry }: ApiKeyWarningProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="apikey-title"
            className="panel relative w-full max-w-lg overflow-hidden border-rose-500/30 p-6 sm:p-8"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-rose-500/20 blur-3xl" />
            <button
              type="button"
              onClick={onClose}
              className="focus-ring absolute right-4 top-4 rounded-full p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl border border-rose-500/40 bg-rose-500/10 shadow-[0_0_30px_rgba(244,63,94,0.35)]">
              <KeyRound className="h-5 w-5 text-rose-400" />
            </div>

            <h2 id="apikey-title" className="text-xl font-semibold text-white">
              {variant === "missing" ? "Falta configurar la API Key de Groq" : "La API Key de Groq no es válida"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {message ??
                "El servidor necesita la variable GROQ_API_KEY para analizar. La clave nunca se envía al navegador."}
            </p>

            <ol className="mt-6 space-y-3 text-sm text-zinc-300">
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 font-mono text-xs">1</span>
                <span>
                  Crea una clave gratuita en{" "}
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-rose-300 underline-offset-4 hover:underline"
                  >
                    console.groq.com/keys <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 font-mono text-xs">2</span>
                <span>
                  <strong className="text-white">Local:</strong> añádela a{" "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">.env.local</code> como{" "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">GROQ_API_KEY=gsk_…</code> y reinicia{" "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">npm run dev</code>.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/5 font-mono text-xs">3</span>
                <span>
                  <strong className="text-white">Vercel:</strong> Project → Settings → Environment Variables →{" "}
                  <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs">GROQ_API_KEY</code>, y vuelve a desplegar.
                </span>
              </li>
            </ol>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="focus-ring rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
              >
                Entendido
              </button>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="focus-ring rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_rgba(244,63,94,0.45)] transition hover:bg-rose-400"
                >
                  Volver a verificar
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
