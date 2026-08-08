"use client";

import { Card, Eyebrow } from "@/components/ui";

const PRINCIPLES = [
  {
    title: "현장에서 답을 찾는다",
    body: "회의실보다 현장 데이터와 고객 맥락을 먼저 봅니다. 이상 신호가 보이면 가설을 세우고 공유합니다.",
  },
  {
    title: "빠르게 시도하고 보정한다",
    body: "완벽한 계획보다 작은 실행과 빠른 피드백을 선호합니다. 실수는 숨기지 않고 학습으로 남깁니다.",
  },
  {
    title: "존중을 담아 직접 말한다",
    body: "필요한 피드백은 돌려 말하지 않습니다. 동시에 상대의 맥락을 존중하는 언어를 씁니다.",
  },
  {
    title: "혼자 끌어안지 않는다",
    body: "막히면 버디·멘토·AI 버디에게 먼저 묻습니다. 질문하는 문화가 온보딩의 안전망입니다.",
  },
];

export default function IntroCulturePage() {
  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Culture</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">조직문화</h3>
        <p className="mt-1 text-sm text-ink-soft">
          인터엑스에서 일한다는 것이 일상에서 어떻게 느껴지는지 정리했습니다.
        </p>
      </div>
      <div className="grid gap-4">
        {PRINCIPLES.map((p) => (
          <Card key={p.title}>
            <h4 className="font-bold text-ink">{p.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
