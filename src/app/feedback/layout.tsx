"use client";

import type { ReactNode } from "react";
import { SectionShell } from "@/components/SectionShell";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionShell
      sectionHref="/feedback"
      title="피드백"
      description="미션 AI 피드백과 익명 채널로 적응을 지원합니다. 인사팀은 AI 요약만 확인합니다."
    >
      {children}
    </SectionShell>
  );
}
