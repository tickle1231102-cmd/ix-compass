"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, SecondaryButton, Tag } from "@/components/ui";

const GUIDE_STORAGE_KEY = "ix-compass-newhire-guide-v5";

/** Default portal walkthrough for new hires. */
export const GUIDE_STEPS = [
  {
    tab: "대시보드",
    title: "오늘의 다음 할 일",
    body: "대시보드에서 ‘다음 할 일’ 카드 하나만 먼저 확인하세요. 미션이 보이면 이어하기를 누르면 됩니다.",
    href: "/",
    spotlight: "상단 ‘대시보드’와 강조된 미션 카드를 살펴보세요.",
  },
  {
    tab: "미션 수행",
    title: "미션 → 실천 → 제출",
    body: "위에서부터 미션을 확인하고, 실천 체크를 한 뒤 결과물을 제출하면 피드백이 생성됩니다.",
    href: "/journey/missions#mission",
    spotlight: "미션 수행 페이지 맨 위부터 순서대로 눌러 보세요.",
  },
  {
    tab: "소개",
    title: "회사와 문화",
    body: "비전·핵심가치, 조직문화, 웰컴 가이드북으로 인터엑스를 이해해 보세요.",
    href: "/intro/vision",
    spotlight: "상단 ‘소개’로 이동해 핵심가치를 열어 보세요.",
  },
  {
    tab: "조직",
    title: "사람 찾기",
    body: "조직도, 멘토·버디, 동료 검색, 공지·팀 채널에서 협업 상대를 찾으세요.",
    href: "/org",
    spotlight: "상단 ‘조직 & 담당자’를 눌러 보세요.",
  },
  {
    tab: "자료실",
    title: "툴·FAQ·AI 버디",
    body: "업무 툴, 용어 사전, FAQ, AI 버디로 궁금증을 해결하세요.",
    href: "/resources/tools",
    spotlight: "상단 ‘자료실’을 열어 보세요.",
  },
] as const;

export type GuideStepHref = (typeof GUIDE_STEPS)[number]["href"];

export function hasSeenNewhireGuide(employeeId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(GUIDE_STORAGE_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return Boolean(parsed[employeeId]);
  } catch {
    return false;
  }
}

export function markNewhireGuideSeen(employeeId: string) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(GUIDE_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    parsed[employeeId] = true;
    window.localStorage.setItem(GUIDE_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export function NewhirePortalGuide({
  employeeId,
  onComplete,
  onStepHrefChange,
}: {
  employeeId: string;
  onComplete: () => void;
  onStepHrefChange?: (href: GuideStepHref | null) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = GUIDE_STEPS[step];
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) {
      started.current = true;
      router.push(GUIDE_STEPS[0].href);
    }
  }, [router]);

  useEffect(() => {
    onStepHrefChange?.(current.href);
    return () => onStepHrefChange?.(null);
  }, [current.href, onStepHrefChange]);

  function go(next: number) {
    const clamped = Math.max(0, Math.min(GUIDE_STEPS.length - 1, next));
    setStep(clamped);
    router.push(GUIDE_STEPS[clamped].href);
  }

  function finish() {
    markNewhireGuideSeen(employeeId);
    onStepHrefChange?.(null);
    onComplete();
    router.push("/");
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="portal-guide-title"
      aria-describedby="portal-guide-body"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="brand">
              {step + 1}/{GUIDE_STEPS.length}
            </Tag>
            <Tag tone="neutral">{current.tab}</Tag>
          </div>
          <h3
            id="portal-guide-title"
            className="mt-2 text-base font-bold text-ink sm:text-lg"
          >
            {current.title}
          </h3>
          <p id="portal-guide-body" className="mt-1 text-sm text-ink-soft">
            {current.body}
          </p>
          <p className="mt-1 text-xs text-brand-dark">{current.spotlight}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {step > 0 && (
            <SecondaryButton onClick={() => go(step - 1)}>이전</SecondaryButton>
          )}
          {step < GUIDE_STEPS.length - 1 ? (
            <PrimaryButton onClick={() => go(step + 1)}>다음</PrimaryButton>
          ) : (
            <PrimaryButton onClick={finish}>시작하기</PrimaryButton>
          )}
          <SecondaryButton onClick={finish}>건너뛰기</SecondaryButton>
        </div>
      </div>
    </div>
  );
}
