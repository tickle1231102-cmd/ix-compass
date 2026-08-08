"use client";

import { useEffect } from "react";

export function Toast({
  message,
  open,
  onClose,
  durationMs = 5000,
  actionLabel,
  onAction,
}: {
  message: string;
  open: boolean;
  onClose: () => void;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(id);
  }, [open, durationMs, onClose]);

  if (!open) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 flex max-w-sm -translate-x-1/2 items-center gap-3 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-lg"
    >
      <span>{message}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          className="shrink-0 text-brand-dark underline-offset-2 hover:underline"
          onClick={() => {
            onAction();
            onClose();
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
