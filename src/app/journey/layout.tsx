"use client";

import type { ReactNode } from "react";
import { SectionShell } from "@/components/SectionShell";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionShell
      sectionHref="/journey"
      title="온보딩 여정"
      description="미션 수행·OKR을 중심으로 집중 온보딩을 완주하세요."
    >
      {children}
    </SectionShell>
  );
}
