"use client";

import type { ReactNode } from "react";
import { SectionShell } from "@/components/SectionShell";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <SectionShell
      sectionHref="/org"
      title="조직 & 담당자"
      description="조직도와 멘토·버디, 동료 프로필, 팀 채널을 확인하세요."
    >
      {children}
    </SectionShell>
  );
}
