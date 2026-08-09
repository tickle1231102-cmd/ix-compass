"use client";

import Link from "next/link";
import type { BuddyLink } from "@/lib/buddy-links";

export function BuddyShortcuts({
  links,
  onNavigate,
  dense = false,
}: {
  links: BuddyLink[];
  onNavigate?: () => void;
  dense?: boolean;
}) {
  if (links.length === 0) return null;

  return (
    <div className={dense ? "mt-2 space-y-1.5" : "mt-2.5 space-y-1.5"}>
      <p
        className={`font-semibold text-ink-faint ${
          dense ? "text-[10px]" : "text-[11px]"
        }`}
      >
        바로가기
      </p>
      <div className="flex flex-wrap gap-1.5">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`inline-flex items-center gap-1 rounded-full border border-brand/30 bg-brand-softer/70 font-semibold text-brand-dark transition-colors hover:border-brand hover:bg-brand-softer ${
              dense ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs"
            }`}
          >
            <span>{link.label}</span>
            <span aria-hidden className="text-brand">
              →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
