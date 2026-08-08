"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  TOP_NAV,
  filterNavChildren,
  sectionDefaultHref,
} from "@/lib/nav-config";
import type { UserRole } from "@/lib/types";

export function NavBar({
  guideHighlightHref = null,
}: {
  guideHighlightHref?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, resetDemo, logout } = useStore();
  const role: UserRole = session?.role === "hr" ? "hr" : "newhire";
  /** Touch / coarse pointer fallback when hover is unavailable. */
  const [pinnedHref, setPinnedHref] = useState<string | null>(null);

  useEffect(() => {
    setPinnedHref(null);
  }, [pathname]);

  const accountLabel = session
    ? [
        session.isGuest ? "게스트" : null,
        session.role === "hr"
          ? `${session.name} · 인사팀`
          : `${session.name} · ${session.team ?? ""}`,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <header className="sticky top-0 z-30 overflow-visible border-b border-line bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-3 overflow-visible px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-lg font-black tracking-tight text-brand">IX</span>
          <span className="text-lg font-bold tracking-tight text-ink">Compass</span>
        </Link>

        {/* Always show every top-level item — no scroll, no wrap, no clip */}
        <nav className="flex flex-nowrap items-center gap-0.5 overflow-visible sm:gap-1">
          {TOP_NAV.map((link) => {
            const children = filterNavChildren(link.children, role);
            const hasChildren = children.length > 0;
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            const guided =
              guideHighlightHref === link.href ||
              (guideHighlightHref != null &&
                children.some((c) => c.href === guideHighlightHref));
            const defaultHref = sectionDefaultHref(link.href, role);
            const pinned = pinnedHref === link.href;

            const triggerClass = `shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              guided
                ? "guide-nav-spotlight bg-brand text-white"
                : active || pinned
                  ? "bg-brand-soft text-brand-dark"
                  : "text-ink-soft group-hover:bg-line-soft group-hover:text-ink hover:bg-line-soft hover:text-ink"
            }`;

            if (!hasChildren) {
              return (
                <Link key={link.href} href={link.href} className={triggerClass}>
                  {link.label}
                </Link>
              );
            }

            return (
              <div
                key={link.href}
                className="group relative shrink-0"
                onMouseLeave={() => {
                  if (pinnedHref === link.href) setPinnedHref(null);
                }}
              >
                <Link
                  href={defaultHref}
                  className={triggerClass}
                  onClick={(e) => {
                    const coarse =
                      typeof window !== "undefined" &&
                      window.matchMedia("(hover: none)").matches;
                    if (coarse && pinnedHref !== link.href) {
                      e.preventDefault();
                      setPinnedHref(link.href);
                    }
                  }}
                >
                  {link.label}
                </Link>

                <div
                  className={`absolute left-0 top-full z-40 min-w-[220px] pt-1 transition-[opacity,visibility] duration-150 ${
                    pinned
                      ? "visible opacity-100"
                      : "invisible opacity-0 group-hover:visible group-hover:opacity-100"
                  }`}
                >
                  <div className="rounded-2xl border border-line bg-white p-2 shadow-lg">
                    <ul className="space-y-0.5">
                      {children.map((child) => {
                        const childActive =
                          pathname === child.href ||
                          pathname.startsWith(`${child.href}/`);
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => setPinnedHref(null)}
                              className={`block rounded-xl px-3 py-2.5 transition-colors ${
                                childActive
                                  ? "bg-brand-soft text-brand-dark"
                                  : "text-ink-soft hover:bg-line-soft hover:text-ink"
                              }`}
                            >
                              <span className="block text-sm font-bold">
                                {child.label}
                              </span>
                              {child.hint && (
                                <span className="mt-0.5 block text-xs text-ink-faint">
                                  {child.hint}
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {accountLabel && (
            <span className="hidden rounded-full border border-line px-3 py-1 text-xs font-medium text-ink-soft xl:inline">
              {accountLabel}
            </span>
          )}
          <button
            onClick={() => {
              if (window.confirm("데모 데이터를 초기 상태로 되돌릴까요?")) {
                resetDemo();
              }
            }}
            className="hidden rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-brand hover:text-brand-dark sm:inline"
          >
            데모 초기화
          </button>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-brand hover:text-brand-dark"
          >
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
