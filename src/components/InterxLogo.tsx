import Link from "next/link";

/** INTERX wordmark — INTER in ink, X in brand orange (interxlab.com). */
export function InterxLogo({
  href = "/",
  className = "",
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center ${className}`}
      aria-label="INTERX 홈"
    >
      <span className="select-none text-[1.35rem] font-black tracking-tight leading-none sm:text-[1.5rem]">
        <span className="text-ink">INTER</span>
        <span className="text-brand">X</span>
      </span>
    </Link>
  );
}
