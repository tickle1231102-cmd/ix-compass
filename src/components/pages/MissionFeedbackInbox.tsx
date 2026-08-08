"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { getFeedbacksForEmployee } from "@/lib/selectors";
import { Card, PrimaryButton, RiskTag, Tag } from "@/components/ui";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function MissionFeedbackInbox() {
  const router = useRouter();
  const { state, session, currentEmployeeId } = useStore();

  useEffect(() => {
    if (session?.role === "hr") {
      router.replace("/feedback/review");
    }
  }, [session, router]);

  if (session?.role === "hr") {
    return (
      <Card>
        <p className="text-sm text-ink-soft">진행 리뷰로 이동 중…</p>
      </Card>
    );
  }

  const items = getFeedbacksForEmployee(state, currentEmployeeId);
  const awaitingHr = items.filter((f) => !f.hrWeeklyFeedback);
  const withHr = items.filter((f) => Boolean(f.hrWeeklyFeedback));

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-ink">미션 피드백</h3>
          <p className="mt-0.5 text-xs text-ink-soft">
            AI 코치 피드백과 인사팀 주간 피드백을 모아 둔 공간입니다.
          </p>
        </div>
        <Link href="/journey/missions">
          <PrimaryButton>미션 수행</PrimaryButton>
        </Link>
      </div>

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">
            아직 모인 피드백이 없어요. 미션을 제출하면 AI 피드백이 여기에
            쌓입니다.
          </p>
        </Card>
      ) : (
        <>
          {awaitingHr.length > 0 && (
            <p className="text-[11px] font-semibold text-ink-soft">
              인사 주간 피드백 대기 {awaitingHr.length}건
            </p>
          )}

          <ul className="space-y-2">
            {items.map((fb) => (
              <li key={fb.id}>
                <Card className="!p-2.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Tag tone="brand">{fb.week}주차</Tag>
                        <RiskTag level={fb.forHr.riskLevel} />
                        {fb.hrWeeklyFeedback ? (
                          <Tag tone="stable">인사 전달됨</Tag>
                        ) : (
                          <Tag tone="watch">인사 대기</Tag>
                        )}
                      </div>
                      <h4 className="mt-1 truncate text-sm font-bold text-ink">
                        {fb.missionTitle}
                      </h4>
                      <p className="text-[11px] text-ink-soft">
                        AI {formatDate(fb.generatedAt)}
                        {fb.hrDeliveredAt && (
                          <> · 인사 {formatDate(fb.hrDeliveredAt)}</>
                        )}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold tabular-nums text-ink">
                      {fb.forHr.progressPct}%
                    </p>
                  </div>

                  <div className="mt-2 rounded-lg border border-line-soft bg-line-soft/40 px-2.5 py-2">
                    <p className="text-[11px] font-bold text-brand">AI 피드백</p>
                    <p className="mt-1 text-sm leading-snug text-ink">
                      {fb.forNewhire.coachText}
                    </p>
                    {fb.forNewhire.nextActions.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {fb.forNewhire.nextActions.map((a, i) => (
                          <li key={i} className="text-xs text-ink-soft">
                            · {a}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {fb.hrWeeklyFeedback ? (
                    <div className="mt-1.5 rounded-lg border border-brand/25 bg-brand-softer/40 px-2.5 py-2">
                      <p className="text-[11px] font-bold text-brand-dark">
                        인사팀 주간 피드백
                      </p>
                      <p className="mt-1 text-sm leading-snug text-ink">
                        {fb.hrWeeklyFeedback}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-ink-soft">
                      인사담당자가 AI 피드백을 검토한 뒤 주간 피드백을
                      전달합니다.
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>

          {withHr.length === 0 && items.length > 0 && (
            <p className="text-center text-[11px] text-ink-soft">
              주간 피드백이 도착하면 이 목록에서 바로 확인할 수 있어요.
            </p>
          )}
        </>
      )}
    </div>
  );
}
