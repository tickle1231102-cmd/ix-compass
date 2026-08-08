"use client";

import Link from "next/link";
import { Card, Eyebrow, SecondaryButton, Tag } from "@/components/ui";

const SECTIONS = [
  {
    tag: "복지",
    title: "기본 복리후생",
    body: "연차·경조사·식사·자기계발 지원 등 핵심 복지는 입사 서류와 함께 안내됩니다. 자세한 FAQ는 자료실에서 확인하세요.",
  },
  {
    tag: "근무",
    title: "근무 규칙 요약",
    body: "코어타임과 협업 리듬은 팀별로 다를 수 있습니다. 입사 첫 주 버디와 팀  Norm을 맞춰 보세요.",
  },
  {
    tag: "오피스",
    title: "오피스 맵 · 시설",
    body: "출입·회의실·장비 대여 위치는 Day1 투어에서 안내합니다. 층별 맵은 온보딩 키트와 슬랙 고정 채널에 있습니다.",
  },
];

export default function IntroGuidebookPage() {
  return (
    <div className="space-y-3">
      <div>
        <Eyebrow>Welcome Guidebook</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">웰컴 가이드북</h3>
        <p className="mt-1 text-sm text-ink-soft">
          복지·근무·오피스 기본 정보를 한곳에 모았습니다.
        </p>
      </div>
      {SECTIONS.map((s) => (
        <Card key={s.title}>
          <Tag tone="brand">{s.tag}</Tag>
          <h4 className="mt-2 font-bold text-ink">{s.title}</h4>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
        </Card>
      ))}
      <div className="flex flex-wrap gap-2">
        <Link href="/resources/tools">
          <SecondaryButton>업무 툴 가이드</SecondaryButton>
        </Link>
        <Link href="/resources/faq">
          <SecondaryButton>FAQ 더 보기</SecondaryButton>
        </Link>
      </div>
    </div>
  );
}
