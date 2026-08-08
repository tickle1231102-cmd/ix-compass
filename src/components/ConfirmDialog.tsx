"use client";

import type { ReactNode } from "react";
import { PrimaryButton, SecondaryButton } from "@/components/ui";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "확인",
  cancelLabel = "취소",
  tone = "default",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
        className="w-full max-w-md rounded-2xl border border-line bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-dialog-title" className="text-lg font-bold text-ink">
          {title}
        </h3>
        <div id="confirm-dialog-body" className="mt-2 text-sm text-ink-soft">
          {body}
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <SecondaryButton onClick={onCancel}>{cancelLabel}</SecondaryButton>
          <PrimaryButton
            onClick={onConfirm}
            className={
              tone === "danger"
                ? "!bg-alert hover:!bg-alert"
                : undefined
            }
          >
            {confirmLabel}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
