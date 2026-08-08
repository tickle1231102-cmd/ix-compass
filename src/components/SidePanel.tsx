"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { NavChild } from "@/lib/nav-config";

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
                className={`min-h-11 w-full rounded-xl px-3.5 py-3 text-left transition-colors ${
                  active
                    ? "bg-brand-soft text-brand-dark"
                    : "text-ink-soft hover:bg-line-soft hover:text-ink"
                }`}
              >
                <span className="block text-sm font-bold">{item.label}</span>
                {item.hint && (
                  <span
                    className={`mt-0.5 block text-xs ${
                      active ? "text-brand-dark/70" : "text-ink-soft"
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
        "missions",
        "okr-draft",
      ];
      if (named.includes(segment)) return false;
      return true;
    }
    return false;
  }
  if (href === "/journey/missions") {
    return (
      activeHref === href ||
      (activeHref.startsWith(`${href}/`) &&
        !activeHref.includes("/missions/manage") &&
        !activeHref.includes("/missions/review"))
    );
  }
  return activeHref === href || activeHref.startsWith(`${href}/`);
}

function NavLinkItem({
  item,
  activeHref,
}: {
  item: NavChild;
  activeHref: string;
}) {
  const active = isNavActive(item.href, activeHref);
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`block min-h-11 rounded-xl px-3.5 py-3 transition-colors ${
          active
            ? "bg-brand-soft text-brand-dark"
            : "text-ink-soft hover:bg-line-soft hover:text-ink"
        }`}
      >
        <span className="block text-sm font-bold">{item.label}</span>
        {item.hint && (
          <span
            className={`mt-0.5 block text-xs ${
              active ? "text-brand-dark/70" : "text-ink-soft"
            }`}
          >
            {item.hint}
          </span>
        )}
      </Link>
    </li>
  );
}

export function SideNavLinks({
  items,
  activeHref,
}: {
  items: NavChild[];
  activeHref: string;
}) {
  const primary = items.filter((i) => !i.secondary);
  const secondary = items.filter((i) => i.secondary);

  return (
    <nav aria-label="섹션 메뉴" className="rounded-2xl border border-line bg-white p-2">
      <ul className="space-y-1">
        {primary.map((item) => (
          <NavLinkItem key={item.href} item={item} activeHref={activeHref} />
        ))}
      </ul>
      {secondary.length > 0 && (
        <details className="mt-2 border-t border-line-soft pt-2">
          <summary className="cursor-pointer list-none rounded-xl px-3.5 py-2.5 text-xs font-bold text-ink-soft marker:content-none hover:bg-line-soft [&::-webkit-details-marker]:hidden">
            더보기
          </summary>
          <ul className="mt-1 space-y-1">
            {secondary.map((item) => (
              <NavLinkItem
                key={item.href}
                item={item}
                activeHref={activeHref}
              />
            ))}
          </ul>
        </details>
      )}
    </nav>
  );
}
