"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getHrMissionReviewQueue } from "@/lib/selectors";
import {
  Card,
  Eyebrow,
  PrimaryButton,
  ProgressBar,
  RiskTag,
  Tag,
} from "@/components/ui";

export default function HrMissionReviewPage() {
  const router = useRouter();
  const { state, session, markMissionFeedbackReviewed } = useStore();
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (session && session.role !== "hr") {
      router.replace("/journey/missions");
    }
  }, [session, router]);

  const queue = getHrMissionReviewQueue(state);

  if (session && session.role !== "hr") {
    return (
      <Card>
        <p className="text-sm text-ink-soft">내 미션으로 이동 중…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Mission Progress Copilot</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">미션 진행 리뷰</h3>
        <p className="mt-1 text-sm text-ink-soft">
          AI 요약·진행률·리스크·개입 힌트만 표시됩니다. 신입의 프라이빗 노트
          원문은 열람할 수 없습니다.
        </p>
      </div>

      {queue.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">확인이 필요한 AI 피드백이 없어요.</p>
        </Card>
      ) : (
        <ul className="space-y-4">
          {queue.map((item) => (
            <li key={item.feedbackId}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">
                      {item.employeeName} · {item.week}주차
                    </p>
                    <p className="text-xs text-ink-faint">{item.dept}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      {item.missionTitle}
                    </p>
                  </div>
                  <RiskTag level={item.forHr.riskLevel} />
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-ink-faint">
                    <span>진행률</span>
                    <span>{item.forHr.progressPct}%</span>
                  </div>
                  <ProgressBar value={item.forHr.progressPct} />
                </div>

                <p className="mt-3 text-sm leading-relaxed text-ink">
                  {item.forHr.summary}
                </p>
                <p className="mt-2 text-xs font-medium text-brand-dark">
                  → {item.forHr.interventionHint}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Tag tone="neutral">
                    성공 기준 {item.forHr.criteriaDone}/
                    {item.forHr.criteriaTotal}
                  </Tag>
                  <Tag tone="neutral">
                    가이드 실천 {item.forHr.practicedGuideCount}건
                  </Tag>
                </div>

                <label className="mt-4 block text-sm">
                  <span className="text-xs font-medium text-ink-faint">
                    HR 내부 메모 (신입 비공개 · 선택)
                  </span>
                  <input
                    value={noteById[item.feedbackId] ?? ""}
                    onChange={(e) =>
                      setNoteById((prev) => ({
                        ...prev,
                        [item.feedbackId]: e.target.value,
                      }))
                    }
                    placeholder="예: 버디 페어링 권장"
                    className="mt-1 w-full rounded-xl border border-line px-3.5 py-2.5 outline-none focus:border-brand"
                  />
                </label>

                <div className="mt-3">
                  <PrimaryButton
                    onClick={() =>
                      markMissionFeedbackReviewed(
                        item.feedbackId,
                        noteById[item.feedbackId]
                      )
                    }
                  >
                    확인 완료
                  </PrimaryButton>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
