"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import {
  TOP_NAV,
  filterNavChildren,
  sectionDefaultHref,
} from "@/lib/nav-config";
import type { UserRole } from "@/lib/types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { InterxLogo } from "@/components/InterxLogo";
import { Toast } from "@/components/Toast";

const HEADER_H = 68;

export function NavBar({
  guideHighlightHref = null,
}: {
  guideHighlightHref?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, resetDemo, logout } = useStore();
  const role: UserRole = session?.role === "hr" ? "hr" : "newhire";
  const [openHref, setOpenHref] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const closeToast = useCallback(() => setToast(null), []);
  const closeMenu = useCallback(() => setOpenHref(null), []);

  useEffect(() => {
    setOpenHref(null);
  }, [pathname]);

  const openItem = TOP_NAV.find((l) => l.href === openHref) ?? null;
  const openChildren = openItem
    ? filterNavChildren(openItem.children, role)
    : [];
  const menuOpen = openChildren.length > 0;

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
    <header
      className="relative sticky top-0 z-50 overflow-visible bg-white"
      onMouseLeave={closeMenu}
    >
      <div className="relative z-50 border-b border-line bg-white">
        <div
          className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6"
          style={{ height: HEADER_H }}
        >
          <InterxLogo />

          <nav
            aria-label="주요 메뉴"
            className="flex min-w-0 flex-1 items-center justify-center gap-0.5 sm:gap-1"
          >
            {TOP_NAV.map((link) => {
              const children = filterNavChildren(link.children, role);
              const hasChildren = children.length > 0;
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href ||
                    pathname.startsWith(`${link.href}/`);
              const highlightPath = guideHighlightHref?.split("#")[0] ?? null;
              const guided =
                highlightPath === link.href ||
                (highlightPath != null &&
                  children.some((c) => c.href === highlightPath));
              const defaultHref = sectionDefaultHref(link.href, role);
              const open = openHref === link.href;
              const emphasize = guided || active || open;

              const triggerClass = `inline-flex items-center whitespace-nowrap px-2.5 text-sm font-medium transition-colors sm:px-3 sm:text-[15px] ${
                emphasize ? "text-brand" : "text-ink hover:text-brand"
              }`;

              return (
                <div
                  key={link.href}
                  className="flex items-center"
                  style={{ height: HEADER_H }}
                  onMouseEnter={() =>
                    setOpenHref(hasChildren ? link.href : null)
                  }
                >
                  {hasChildren ? (
                    <Link
                      href={defaultHref}
                      className={triggerClass}
                      style={{ height: HEADER_H }}
                      aria-expanded={open}
                      aria-haspopup="true"
                      onFocus={() => setOpenHref(link.href)}
                      onClick={(e) => {
                        const coarse =
                          typeof window !== "undefined" &&
                          window.matchMedia("(hover: none)").matches;
                        if (coarse && openHref !== link.href) {
                          e.preventDefault();
                          setOpenHref(link.href);
                        }
                      }}
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={triggerClass}
                      style={{ height: HEADER_H }}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {accountLabel && (
              <span className="hidden max-w-[12rem] truncate text-xs font-medium text-ink-soft xl:inline">
                {accountLabel}
              </span>
            )}
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="hidden px-2 text-xs font-medium text-ink-soft transition-colors hover:text-brand sm:inline"
              style={{ height: HEADER_H }}
            >
              데모 초기화
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="inline-flex items-center px-2 text-xs font-medium text-ink-soft transition-colors hover:text-brand"
              style={{ height: HEADER_H }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          className="absolute left-0 right-0 z-50 border-b border-line bg-white shadow-[0_16px_40px_rgba(20,33,61,0.12)]"
          style={{ top: HEADER_H }}
          onMouseEnter={() => setOpenHref(openHref)}
        >
          <div
            className="mx-auto flex max-w-6xl flex-wrap justify-start gap-0 px-4 py-8 sm:px-6"
            role="menu"
            aria-label={`${openItem?.label ?? ""} 하위 메뉴`}
          >
            {openChildren.map((child, idx) => {
              const childActive =
                pathname === child.href ||
                pathname.startsWith(`${child.href}/`);
              return (
                <div
                  key={child.href}
                  className={`w-[200px] shrink-0 px-5 first:pl-0 sm:w-[220px] ${
                    idx > 0 ? "border-l border-line" : ""
                  }`}
                >
                  <Link
                    href={child.href}
                    role="menuitem"
                    onClick={closeMenu}
                    className="group block py-1"
                  >
                    <span
                      className={`block text-[15px] font-bold transition-colors group-hover:text-brand ${
                        childActive ? "text-brand" : "text-ink"
                      }`}
                    >
                      {child.label}
                    </span>
                    {child.hint && (
                      <span className="mt-2 block text-sm leading-relaxed text-ink-soft">
                        {child.hint}
                      </span>
                    )}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="데모 초기화"
        body="데모 데이터를 초기 상태로 되돌릴까요? 이 브라우저에 저장된 진행 내용이 초기화됩니다."
        confirmLabel="초기화"
        tone="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemo();
          setConfirmReset(false);
          setToast("데모 데이터를 초기화했어요.");
        }}
      />
      <Toast
        open={Boolean(toast)}
        message={toast ?? ""}
        onClose={closeToast}
      />
    </header>
  );
}
