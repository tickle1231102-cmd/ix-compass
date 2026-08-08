"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PageShell, SideNavLinks } from "@/components/SidePanel";
import { SectionHeading } from "@/components/ui";
import { sectionSideNav } from "@/lib/nav-config";
import { useStore } from "@/lib/store";
import type { UserRole } from "@/lib/types";

export function SectionShell({
  sectionHref,
  title,
  description,
  eyebrow,
  children,
}: {
  sectionHref: string;
  title: string;
  description: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { session } = useStore();
  const role: UserRole = session?.role === "hr" ? "hr" : "newhire";
  const items = sectionSideNav(sectionHref, role);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      <PageShell
        sidebar={<SideNavLinks items={items} activeHref={pathname} />}
      >
        {children}
      </PageShell>
    </div>
  );
}
