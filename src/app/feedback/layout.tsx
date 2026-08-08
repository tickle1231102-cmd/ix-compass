"use client";

import type { ReactNode } from "react";
import { SectionShell } from "@/components/SectionShell";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionShell
      sectionHref="/feedback"
      title="피드백"
      description="AI·인사 주간 피드백과 익명 채널로 적응을 지원합니다."
    >
      {children}
    </SectionShell>
  );
}
