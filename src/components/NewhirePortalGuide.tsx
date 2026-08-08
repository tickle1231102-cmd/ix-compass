"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton, SecondaryButton, Tag } from "@/components/ui";

const GUIDE_STORAGE_KEY = "ix-compass-newhire-guide-v2";

export const GUIDE_STEPS = [
  {
    tab: "대시보드",
    title: "오늘의 온보딩 허브",
    body: "진행률, 이번 주 미션, 다음에 할 일을 한곳에서 확인하세요.",
    href: "/",
    spotlight: "상단 ‘대시보드’와 진행 현황·미션 카드를 살펴보세요.",
  },
  {
    tab: "소개",
    title: "회사와 문화 알아보기",
    body: "비전·핵심가치, 조직문화, 웰컴 가이드북으로 인터엑스를 이해해 보세요.",
    href: "/intro/vision",
    spotlight: "상단 ‘소개’ 메뉴에서 세 가지 가이드를 열어 보세요.",
  },
  {
    tab: "온보딩 여정",
    title: "체크리스트·미션·가이드",
    body: "30-60-90 체크리스트와 미션, AI 업무 가이드로 집중 온보딩을 수행하세요.",
    href: "/journey/checklist",
    spotlight: "체크리스트와 ‘미션’ 메뉴를 직접 눌러 보세요.",
  },
  {
    tab: "조직 & 담당자",
    title: "사람 찾기",
    body: "조직도, 멘토·버디, 동료 검색, 공지·팀 채널에서 협업 상대를 찾으세요.",
    href: "/org",
    spotlight: "조직도와 멘토/버디 카드를 확인해 보세요.",
  },
  {
    tab: "자료실",
    title: "툴·FAQ·AI 버디",
    body: "업무 툴 가이드, 용어 사전, FAQ, AI 버디로 궁금증을 해결하세요.",
    href: "/resources/tools",
    spotlight: "검색과 AI 버디 메뉴를 살펴보세요.",
  },
  {
    tab: "피드백",
    title: "미션 피드백 · 익명 채널",
    body: "AI 미션 피드백을 확인하고, 속마음은 익명 피드백으로 남길 수 있어요.",
    href: "/feedback/missions",
    spotlight: "미션 피드백과 익명 피드백 메뉴를 확인해 보세요.",
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
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="brand">
              {step + 1}/{GUIDE_STEPS.length}
            </Tag>
            <Tag tone="neutral">{current.tab}</Tag>
          </div>
          <h3 className="mt-2 text-base font-bold text-ink sm:text-lg">
            {current.title}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">{current.body}</p>
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
