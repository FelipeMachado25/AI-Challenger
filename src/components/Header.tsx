"use client";

import { Zap } from "lucide-react";

import { cn } from "@/lib/utils";

export type ConnectionStatus = "checking" | "online" | "missing";

interface HeaderProps {
  status: ConnectionStatus;
  onStatusClick?: () => void;
}

const STATUS_COPY: Record<ConnectionStatus, { label: string; dot: string; text: string }> = {
  checking: { label: "Checking…", dot: "bg-zinc-400 animate-pulse", text: "text-zinc-400" },
  online: { label: "Groq connected", dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]", text: "text-emerald-300" },
  missing: { label: "API key missing", dot: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.9)]", text: "text-rose-300" },
};

export function Header({ status, onStatusClick }: HeaderProps) {
  const s = STATUS_COPY[status];
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-zinc-950/70 pt-[env(safe-area-inset-top)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-rose-500 via-purple-500 to-cyan-500 p-[1.5px]">
            <div className="grid h-full w-full place-items-center rounded-[10px] bg-zinc-950">
              <Zap className="h-4 w-4 text-white" strokeWidth={2.5} aria-hidden />
            </div>
          </div>
          <div className="leading-tight">
            <h1 className="text-base font-semibold tracking-tight text-white sm:text-lg">AI Challenger</h1>
            <p className="hidden text-xs text-zinc-500 sm:block">Stress-test your strategy in seconds</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStatusClick}
          disabled={status !== "missing"}
          className={cn(
            "focus-ring flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium transition",
            s.text,
            status === "missing" ? "cursor-pointer hover:bg-white/[0.06]" : "cursor-default",
          )}
          aria-live="polite"
        >
          <span className={cn("h-2 w-2 rounded-full", s.dot)} aria-hidden />
          {s.label}
        </button>
      </div>
    </header>
  );
}
