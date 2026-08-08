"use client";

import { Card, Eyebrow } from "@/components/ui";

const PRINCIPLES = [
  {
    title: "목표를 수치로 관리한다",
    body: "조직 목표와 연결된 도전적 목표를 세우고, 선행·후행 지표로 진척을 봅니다. 감이 아니라 정량으로 정렬합니다.",
  },
  {
    title: "시간을 아끼고 높은 가치에 쓴다",
    body: "AI와 도구로 반복 업무를 줄이고, 확보한 시간을 본질적인 문제에 씁니다. 마감은 약속입니다.",
  },
  {
    title: "실패를 학습으로 바꾸며 끝까지 간다",
    body: "한 번에 되지 않아도 전략을 수정해 다시 실행합니다. 불확실해도 해결책을 찾아냅니다.",
  },
  {
    title: "피드백과 관계로 함께 성장한다",
    body: "성장지향 피드백을 주고받고, 신뢰 기반 네트워크로 시너지를 만듭니다. 혼자 끌어안지 않습니다.",
  },
];

export default function IntroCulturePage() {
  return (
    <div className="space-y-3">
      <div>
        <Eyebrow>Culture</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">조직문화</h3>
        <p className="mt-1 text-sm text-ink-soft">
          12가지 핵심가치가 일상에서 어떻게 느껴지는지, 일하는 원칙으로
          정리했습니다.
        </p>
      </div>
      <div className="grid gap-2.5">
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
