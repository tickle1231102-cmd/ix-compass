"use client";

import { Card, Eyebrow, Tag } from "@/components/ui";
import { DNA_VALUES } from "@/lib/seed";

export default function IntroVisionPage() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Vision & DNA</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">비전 & 핵심가치</h3>
        <p className="mt-1 text-sm text-ink-soft">
          인터엑스가 현장과 데이터를 잇는 방식, 그리고 12가지 핵심가치를
          소개합니다.
        </p>
      </div>

      <Card>
        <h4 className="font-bold text-ink">우리가 만드는 미래</h4>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          산업 현장의 보이지 않는 신호를 데이터로 읽고, 더 안전하고 스마트한
          의사결정을 가능하게 합니다. 온보딩 기간 동안 이 비전을 「오늘 할 일」로
          쪼개어 실천하는 것이 IX Compass의 목표입니다.
        </p>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {DNA_VALUES.map((dna) => (
          <Card key={dna.id}>
            <Tag tone="brand">{dna.shortLabel}</Tag>
            <p className="mt-2 font-semibold text-ink">{dna.label}</p>
            <p className="mt-1 text-sm text-ink-soft">{dna.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
