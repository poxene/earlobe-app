import { useEffect, useRef, type ReactNode } from "react";
import { GoldAmount } from "@/components/Gold";
import type { AwaySummary, GameToast } from "@/lib/game/snapshot";

const TOAST_MS = 4_000;

export function ToastStack({ toasts, onDone }: { toasts: GameToast[]; onDone: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex w-[min(100%-2rem,20rem)] flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDone={onDone} />
      ))}
    </div>
  );
}

function Toast({ toast, onDone }: { toast: GameToast; onDone: (id: string) => void }) {
  const dismiss = useRef(onDone);
  dismiss.current = onDone;

  useEffect(() => {
    const id = window.setTimeout(() => dismiss.current(toast.id), TOAST_MS);
    return () => window.clearTimeout(id);
  }, [toast.id]);

  return (
    <button
      type="button"
      onClick={() => onDone(toast.id)}
      className="pointer-events-auto border border-gold/50 bg-ink/95 px-3 py-3 text-left text-sm text-zinc-100"
    >
      {toast.message}
    </button>
  );
}

export function LevelUpModal({
  level,
  unallocated,
  onClose,
}: {
  level: number;
  unallocated: number;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <p className="text-[11px] tracking-[0.28em] text-gold">LEVEL UP</p>
      <h2 className="level-glow mt-2 font-display text-7xl leading-none">{String(level).padStart(2, "0")}</h2>
      <p className="mt-3 text-zinc-300">
        {unallocated} stat points to assign. 1 skill point was added.
      </p>
    </Modal>
  );
}

export function UnlockModal({
  classId,
  color,
  onClose,
}: {
  classId: string;
  color: string;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <p className="text-[11px] tracking-[0.28em]" style={{ color }}>
        CLASS UNLOCKED
      </p>
      <h2 className="mt-2 font-display text-6xl leading-none" style={{ color }}>
        {classId}
      </h2>
    </Modal>
  );
}

export function AwayModal({ summary, onClose }: { summary: AwaySummary; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <p className="text-[11px] tracking-[0.28em] text-gold">WHILE YOU WERE AWAY</p>
      <h2 className="mt-2 font-display text-5xl leading-none">Progress while you were away</h2>
      <p className="mt-4 text-zinc-200">
        {summary.battles} battles: {summary.victories} victories, {summary.escapes} escaped. +{summary.xp} XP,{" "}
        <GoldAmount amount={summary.echoes} labeled />
        {summary.relicName ? `, 1 relic (${summary.relicName})` : ""}.
      </p>
    </Modal>
  );
}

export function QuestModal({ title, xp, onClose }: { title: string; xp: number; onClose: () => void }) {
  return (
    <Modal onClose={onClose}>
      <p className="text-[11px] tracking-[0.28em] text-gold">QUEST COMPLETE</p>
      <h2 className="mt-2 font-display text-5xl leading-none">{title}</h2>
      <p className="mt-3 text-zinc-300">+{xp} XP.</p>
    </Modal>
  );
}

function Modal({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-md border border-gold/40 bg-panel p-6">
        {children}
        <button type="button" onClick={onClose} className="mt-6 bg-gold px-5 py-2 text-sm font-semibold text-ink">
          Close
        </button>
      </div>
    </div>
  );
}
