"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export function PageShell({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar?: ReactNode;
}) {
  if (!sidebar) {
    return <div className="min-w-0">{children}</div>;
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">{sidebar}</aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function SideNav({
  items,
  activeId,
  onSelect,
}: {
  items: { id: string; label: string; hint?: string }[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="rounded-2xl border border-line bg-white p-2">
      <ul className="space-y-1">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full rounded-xl px-3.5 py-3 text-left transition-colors ${
                  active
                    ? "bg-brand-soft text-brand-dark"
                    : "text-ink-soft hover:bg-line-soft hover:text-ink"
                }`}
              >
                <span className="block text-sm font-bold">{item.label}</span>
                {item.hint && (
                  <span
                    className={`mt-0.5 block text-xs ${
                      active ? "text-brand-dark/70" : "text-ink-faint"
                    }`}
                  >
                    {item.hint}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function isNavActive(href: string, activeHref: string): boolean {
  // AI buddy thread list vs named sub-routes (legacy + /resources/ai-buddy).
  if (href === "/resources/ai-buddy" || href === "/ai-buddy") {
    if (activeHref === href) return true;
    const prefixes = ["/resources/ai-buddy/", "/ai-buddy/"];
    for (const prefix of prefixes) {
      if (!activeHref.startsWith(prefix)) continue;
      const segment = activeHref.slice(prefix.length).split("/")[0];
      const named = [
        "guide",
        "reflection",
        "feedback",
        "risk-radar",
        "okr-draft",
        "missions",
      ];
      return !named.includes(segment);
    }
    return false;
  }
  // Sibling routes under missions: manage vs list must not cross-highlight.
  if (href.endsWith("/missions") && !href.endsWith("/missions/manage")) {
    return (
      activeHref === href ||
      (activeHref.startsWith(`${href}/`) &&
        !activeHref.includes("/missions/manage") &&
        !activeHref.includes("/missions/review"))
    );
  }
  return activeHref === href || activeHref.startsWith(`${href}/`);
}

export function SideNavLinks({
  items,
  activeHref,
}: {
  items: { href: string; label: string; hint?: string }[];
  activeHref: string;
}) {
  return (
    <nav className="rounded-2xl border border-line bg-white p-2">
      <ul className="space-y-1">
        {items.map((item) => {
          const active = isNavActive(item.href, activeHref);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-xl px-3.5 py-3 transition-colors ${
                  active
                    ? "bg-brand-soft text-brand-dark"
                    : "text-ink-soft hover:bg-line-soft hover:text-ink"
                }`}
              >
                <span className="block text-sm font-bold">{item.label}</span>
                {item.hint && (
                  <span
                    className={`mt-0.5 block text-xs ${
                      active ? "text-brand-dark/70" : "text-ink-faint"
                    }`}
                  >
                    {item.hint}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
