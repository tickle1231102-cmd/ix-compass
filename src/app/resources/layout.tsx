"use client";

import type { ReactNode } from "react";
import { SectionShell } from "@/components/SectionShell";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionShell
      sectionHref="/resources"
      title="자료실"
      description="업무 툴 가이드, 용어 사전, FAQ, AI 버디로 궁금증을 해결하세요."
    >
      {children}
    </SectionShell>
  );
}
