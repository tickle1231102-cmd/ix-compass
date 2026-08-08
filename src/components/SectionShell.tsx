"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { PageShell, SideNavLinks } from "@/components/SidePanel";
import { resolvePageHero } from "@/lib/page-heroes";
import { sectionSideNav } from "@/lib/nav-config";
import { useStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

export function SectionShell({
  sectionHref,
  title,
  description,
  children,
}: {
  sectionHref: string;
  title: string;
  description: string;
  /** @deprecated Hero shows section identity; kept for call-site compat */
  eyebrow?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { session } = useStore();
  const role: UserRole = session?.role === "hr" ? "hr" : "newhire";
  const items = sectionSideNav(sectionHref, role);
  const hero = resolvePageHero(sectionHref, pathname);

  return (
    <div>
      {hero && <PageHero {...hero} />}

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 max-w-2xl">
          <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
          {description && (
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
              {description}
            </p>
          )}
        </div>

        <PageShell
          sidebar={<SideNavLinks items={items} activeHref={pathname} />}
        >
          {children}
        </PageShell>
      </div>
    </div>
  );
}
