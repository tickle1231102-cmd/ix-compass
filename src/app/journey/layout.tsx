"use client";

import type { ReactNode } from "react";
import { SectionShell } from "@/components/SectionShell";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionShell
      sectionHref="/journey"
      eyebrow="Onboarding Journey"
      title="온보딩 여정"
      description="단계별 체크리스트·미션·OKR·가이드로 집중 온보딩을 완주하세요."
    >
      {children}
    </SectionShell>
  );
}
