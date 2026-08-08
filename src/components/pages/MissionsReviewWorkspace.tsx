"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getHrMissionReviewQueue } from "@/lib/selectors";
import {
  Card,
  PrimaryButton,
  ProgressBar,
  RiskTag,
  Tag,
} from "@/components/ui";

export default function HrMissionReviewPage() {
  const router = useRouter();
  const { state, session, markMissionFeedbackReviewed } = useStore();
  const [weeklyById, setWeeklyById] = useState<Record<string, string>>({});
  const [internalById, setInternalById] = useState<Record<string, string>>({});

  useEffect(() => {
    if (session && session.role !== "hr") {
      router.replace("/feedback/missions");
    }
  }, [session, router]);

  const queue = getHrMissionReviewQueue(state);

  if (session && session.role !== "hr") {
    return (
      <Card>
        <p className="text-sm text-ink-soft">미션 피드백으로 이동 중…</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2.5">
      <div>
        <h3 className="text-base font-bold text-ink">진행 리뷰</h3>
        <p className="mt-0.5 text-xs text-ink-soft">
          AI 요약을 보고 매주 주간 피드백을 신입에게 전달하세요. 프라이빗 노트
          원문은 열람할 수 없습니다.
        </p>
      </div>

      {queue.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">
            전달할 AI 피드백이 없어요.
          </p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {queue.map((item) => {
            const weekly = weeklyById[item.feedbackId] ?? "";
            return (
              <li key={item.feedbackId}>
                <Card className="!p-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {item.employeeName} · {item.week}주차
                      </p>
                      <p className="text-[11px] text-ink-faint">{item.dept}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {item.missionTitle}
                      </p>
                    </div>
                    <RiskTag level={item.forHr.riskLevel} />
                  </div>

                  <div className="mt-2">
                    <div className="mb-0.5 flex justify-between text-[11px] text-ink-faint">
                      <span>진행률</span>
                      <span>{item.forHr.progressPct}%</span>
                    </div>
                    <ProgressBar value={item.forHr.progressPct} />
                  </div>

                  <div className="mt-2 rounded-lg border border-line-soft bg-line-soft/40 px-2.5 py-2">
                    <p className="text-[11px] font-bold text-brand">AI 요약</p>
                    <p className="mt-1 text-sm leading-snug text-ink">
                      {item.forHr.summary}
                    </p>
                    <p className="mt-1 text-xs font-medium text-brand-dark">
                      → {item.forHr.interventionHint}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <Tag tone="neutral" className="!text-[10px]">
                        결과물 {item.forHr.artifactCount}
                      </Tag>
                      <Tag tone="neutral" className="!text-[10px]">
                        실천 {item.forHr.practicedGuideCount}
                      </Tag>
                    </div>
                  </div>

                  <label className="mt-2 block">
                    <span className="text-[11px] font-semibold text-ink">
                      주간 피드백 (신입에게 전달)
                    </span>
                    <textarea
                      value={weekly}
                      onChange={(e) =>
                        setWeeklyById((prev) => ({
                          ...prev,
                          [item.feedbackId]: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="이번 주 잘한 점·다음 주 부탁을 짧게 적어 주세요."
                      className="mt-1 w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand"
                    />
                  </label>

                  <label className="mt-1.5 block">
                    <span className="text-[11px] font-medium text-ink-faint">
                      내부 메모 (신입 비공개 · 선택)
                    </span>
                    <input
                      value={internalById[item.feedbackId] ?? ""}
                      onChange={(e) =>
                        setInternalById((prev) => ({
                          ...prev,
                          [item.feedbackId]: e.target.value,
                        }))
                      }
                      placeholder="예: 버디 페어링 권장"
                      className="mt-1 w-full rounded-lg border border-line px-2.5 py-1.5 text-sm outline-none focus:border-brand"
                    />
                  </label>

                  <div className="mt-2">
                    <PrimaryButton
                      disabled={!weekly.trim()}
                      onClick={() =>
                        markMissionFeedbackReviewed(
                          item.feedbackId,
                          internalById[item.feedbackId],
                          weekly
                        )
                      }
                    >
                      주간 피드백 전달
                    </PrimaryButton>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
