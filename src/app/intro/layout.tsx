"use client";

import type { ReactNode } from "react";
import { SectionShell } from "@/components/SectionShell";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionShell
      sectionHref="/intro"
      eyebrow="Introduction"
      title="소개"
      description="회사 철학과 문화, 웰컴 가이드를 통해 인터엑스를 알아가세요."
    >
      {children}
    </SectionShell>
  );
}
