"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, ImagePlus, Loader2, PenLine, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useCallback, useRef, useState, type DragEvent } from "react";

import { compressImage, dataUrlSizeKb } from "@/lib/image";
import { LIMITS, type InputMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface InputSectionProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  text: string;
  onTextChange: (text: string) => void;
  image: string | null;
  onImageChange: (image: string | null) => void;
  context: string;
  onContextChange: (context: string) => void;
  disabled?: boolean;
  onSubmitShortcut?: () => void;
}

const EXAMPLES = [
  "Launch a monthly subscription app that lets small businesses manage their invoices with AI.",
  "Turn our bank branches into coworking spaces with financial advisory services.",
  "A B2B marketplace where restaurants buy surplus food from local producers.",
];

const TABS: { id: InputMode; label: string; icon: typeof Camera }[] = [
  { id: "image", label: "Board photo", icon: Camera },
  { id: "text", label: "Quick text", icon: PenLine },
];

export function InputSection({
  mode,
  onModeChange,
  text,
  onTextChange,
  image,
  onImageChange,
  context,
  onContextChange,
  disabled,
  onSubmitShortcut,
}: InputSectionProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setImageError(null);
      setProcessing(true);
      try {
        const dataUrl = await compressImage(file);
        onImageChange(dataUrl);
      } catch (error) {
        setImageError(error instanceof Error ? error.message : "Could not process the image.");
      } finally {
        setProcessing(false);
      }
    },
    [onImageChange],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    void handleFile(e.dataTransfer.files?.[0]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      onSubmitShortcut?.();
    }
  };

  return (
    <section className="panel p-4 sm:p-6" aria-labelledby="input-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="input-title" className="text-sm font-semibold uppercase tracking-[0.14em] text-zinc-400">
          1 · Capture the idea
        </h2>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Input mode" className="relative mb-5 grid grid-cols-2 rounded-xl border border-white/[0.06] bg-black/40 p-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = mode === id;
          return (
            <button
              key={id}
              role="tab"
              type="button"
              aria-selected={active}
              disabled={disabled}
              onClick={() => onModeChange(id)}
              className={cn(
                "focus-ring relative z-10 flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors",
                active ? "text-white" : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {active && (
                <motion.span
                  layoutId="input-tab"
                  className="absolute inset-0 -z-10 rounded-lg border border-white/10 bg-zinc-800/80 shadow-lg"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {mode === "image" ? (
          <motion.div
            key="image"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif"
              className="hidden"
              onChange={(e) => {
                void handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />

            {image ? (
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
                <Image
                  src={image}
                  alt="Board preview"
                  width={1600}
                  height={1200}
                  unoptimized
                  className="max-h-[360px] w-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <span className="rounded-full bg-black/60 px-2.5 py-1 font-mono text-[11px] text-zinc-300">
                    JPEG · {dataUrlSizeKb(image)} KB
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => cameraRef.current?.click()}
                      className="focus-ring flex min-h-[40px] items-center gap-1.5 rounded-lg bg-white/10 px-3 text-xs font-medium text-white backdrop-blur transition hover:bg-white/20"
                    >
                      <Camera className="h-3.5 w-3.5" /> Retake
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onImageChange(null)}
                      className="focus-ring flex min-h-[40px] items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 text-xs font-medium text-rose-200 backdrop-blur transition hover:bg-rose-500/30"
                      aria-label="Remove image"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!disabled) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "grid-noise flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors",
                  dragging ? "border-purple-400/70 bg-purple-500/10" : "border-white/10 bg-black/30",
                )}
              >
                {processing ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-zinc-400" aria-hidden />
                    <p className="text-sm text-zinc-400">Compressing image…</p>
                  </>
                ) : (
                  <>
                    <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
                      <ImagePlus className="h-6 w-6 text-zinc-300" aria-hidden />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">Snap the sticky-note board</p>
                      <p className="mt-1 text-xs text-zinc-500">or drag an image here · PNG, JPG, WEBP</p>
                    </div>
                    <div className="flex w-full max-w-sm flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => cameraRef.current?.click()}
                        className="focus-ring flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                      >
                        <Camera className="h-4 w-4" /> Take photo
                      </button>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => fileRef.current?.click()}
                        className="focus-ring flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-medium text-zinc-200 transition hover:bg-white/5"
                      >
                        <Upload className="h-4 w-4" /> Upload file
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {imageError && (
              <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {imageError}
              </p>
            )}

            <div>
              <label htmlFor="image-context" className="mb-1.5 block text-xs font-medium text-zinc-500">
                Optional context (industry, workshop goal…)
              </label>
              <input
                id="image-context"
                type="text"
                value={context}
                disabled={disabled}
                maxLength={300}
                onChange={(e) => onContextChange(e.target.value)}
                placeholder="E.g. Retail innovation workshop, 2026 goal"
                className="focus-ring w-full rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3 text-sm text-white placeholder:text-zinc-600"
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            <div className="relative">
              <label htmlFor="idea-text" className="sr-only">
                Describe the idea
              </label>
              <textarea
                id="idea-text"
                value={text}
                disabled={disabled}
                maxLength={LIMITS.maxTextChars}
                onChange={(e) => onTextChange(e.target.value)}
                onKeyDown={onKeyDown}
                rows={6}
                placeholder="Describe the idea, proposal or strategy you want to stress-test…"
                className="focus-ring w-full resize-y rounded-xl border border-white/[0.08] bg-black/40 px-4 py-3.5 text-[15px] leading-relaxed text-white placeholder:text-zinc-600"
              />
              <span className="pointer-events-none absolute bottom-3 right-3 font-mono text-[11px] text-zinc-600">
                {text.length}/{LIMITS.maxTextChars}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  disabled={disabled}
                  onClick={() => onTextChange(example)}
                  className="focus-ring max-w-full truncate rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-400 transition hover:border-white/20 hover:text-zinc-200"
                  title={example}
                >
                  {example.length > 48 ? `${example.slice(0, 48)}…` : example}
                </button>
              ))}
            </div>
            <p className="hidden text-xs text-zinc-600 sm:block">
              Shortcut: <kbd className="rounded bg-white/5 px-1.5 py-0.5 font-mono">⌘/Ctrl + Enter</kbd> to analyze
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
