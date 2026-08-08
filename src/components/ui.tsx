import type { ReactNode } from "react";
import type { RiskLevel, Sentiment } from "@/lib/types";

export function Card({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`scroll-mt-36 rounded-2xl border border-line bg-white p-5 sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}

/** Small orange eyebrow label, echoing the "IX 뉴스" tag style on interxlab.com. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="text-xs font-bold uppercase tracking-wide text-brand">
      {children}
    </span>
  );
}

const TONE_CLASSES = {
  brand: "bg-brand-soft text-brand-dark",
  neutral: "bg-line-soft text-ink-soft",
  stable: "bg-stable-soft text-stable",
  watch: "bg-watch-soft text-watch",
  alert: "bg-alert-soft text-alert",
} as const;

export function Tag({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof TONE_CLASSES;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const RISK_LABEL: Record<RiskLevel, string> = {
  stable: "안정",
  watch: "관찰",
  alert: "주의",
};

const RISK_TONE: Record<RiskLevel, keyof typeof TONE_CLASSES> = {
  stable: "stable",
  watch: "watch",
  alert: "alert",
};

export function RiskTag({ level }: { level: RiskLevel }) {
  return <Tag tone={RISK_TONE[level]}>{RISK_LABEL[level]}</Tag>;
}

const SENTIMENT_LABEL: Record<Sentiment, string> = {
  positive: "긍정",
  neutral: "중립",
  risk: "확인 필요",
};

const SENTIMENT_TONE: Record<Sentiment, keyof typeof TONE_CLASSES> = {
  positive: "stable",
  neutral: "neutral",
  risk: "alert",
};

export function SentimentTag({ sentiment }: { sentiment: Sentiment }) {
  return <Tag tone={SENTIMENT_TONE[sentiment]}>{SENTIMENT_LABEL[sentiment]}</Tag>;
}

export function ProgressBar({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2.5 w-full overflow-hidden rounded-full bg-line-soft"
    >
      <div
        className="h-full rounded-full bg-brand transition-all"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 space-y-1.5">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
      {description && (
        <p className="max-w-2xl text-sm leading-relaxed text-ink-soft">
          {description}
        </p>
      )}
    </div>
  );
}

export function StatBlock({
  value,
  label,
}: {
  value: ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="text-2xl font-bold text-ink sm:text-3xl">{value}</div>
      <div className="mt-1 text-xs font-medium text-ink-faint">{label}</div>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  className = "",
  busy = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
  busy?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}
