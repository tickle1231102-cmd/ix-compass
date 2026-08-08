"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { DNA_MAP } from "@/lib/seed";
import {
  getActiveAssignmentForEmployee,
  getAssignmentById,
  getEmployeeById,
  getLatestChecklistForEmployee,
} from "@/lib/selectors";
import {
  Card,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  Tag,
} from "@/components/ui";

function AiBuddyGuidePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, session, currentEmployeeId, runContextChecklist, practiceGuide } =
    useStore();
  const [taskInput, setTaskInput] = useState("");

  const assignmentIdParam = searchParams.get("assignmentId") ?? undefined;
  const taskParam = searchParams.get("task") ?? "";

  const linkedAssignment =
    (assignmentIdParam
      ? getAssignmentById(state, assignmentIdParam)
      : undefined) ?? getActiveAssignmentForEmployee(state, currentEmployeeId);

  useEffect(() => {
    if (session?.role === "hr") {
      router.replace("/journey/missions/manage");
    }
  }, [session, router]);

  useEffect(() => {
    if (taskParam) {
      setTaskInput(taskParam);
      return;
    }
    if (linkedAssignment && !taskInput) {
      setTaskInput(
        `${linkedAssignment.title} — ${linkedAssignment.description}`
      );
    }
    // Intentionally seed once from mission context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskParam, linkedAssignment?.id]);

  const me = getEmployeeById(state, currentEmployeeId);
  const latestChecklist = getLatestChecklistForEmployee(
    state,
    currentEmployeeId
  );

  if (session?.role === "hr") {
    return (
      <Card>
        <p className="text-sm text-ink-soft">인사팀 메뉴로 이동 중…</p>
      </Card>
    );
  }

  if (!me) return null;

  function handleRunChecklist() {
    const text = taskInput.trim();
    if (!text) return;
    const week = linkedAssignment?.week ?? (me!.weekNumber || 3);
    runContextChecklist(week, text, linkedAssignment?.id);
    setTaskInput("");
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>AI Buddy</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">AI 업무 가이드</h3>
        <p className="mt-1 text-sm text-ink-soft">
          배정 미션에 맞춰 오늘 할 일을 적으면, 필요한 핵심가치와 실천 팁을
          추천합니다. 실천 체크는 미션 진행률에 반영됩니다.
        </p>
      </div>

      {linkedAssignment && (
        <Card className="border-brand/20 bg-brand-softer/40">
          <p className="text-xs font-medium text-brand-dark">연결된 미션</p>
          <p className="mt-1 font-semibold text-ink">
            {linkedAssignment.week}주차 · {linkedAssignment.title}
          </p>
          <Link
            href="/journey/missions"
            className="mt-2 inline-flex text-sm font-semibold text-brand-dark"
          >
            내 미션으로 돌아가기 →
          </Link>
        </Card>
      )}

      <Card>
        <h3 className="text-lg font-bold text-ink">오늘 무엇을 하실 건가요?</h3>
        <p className="mt-1.5 text-sm text-ink-soft">
          미션 맥락이 미리 채워져 있으면 그대로 추천 받아도 되고, 더 구체적인
          오늘 할 일로 바꿔도 됩니다.
        </p>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRunChecklist();
            }}
            placeholder="예: 동료 피드백 문장 초안 작성"
            className="flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
          />
          <PrimaryButton
            onClick={handleRunChecklist}
            disabled={!taskInput.trim()}
          >
            추천 받기
          </PrimaryButton>
        </div>

        {latestChecklist && (
          <div className="mt-5 rounded-xl border border-line-soft bg-line-soft/50 p-4">
            <p className="text-xs font-medium text-ink-faint">
              오늘 할 일 · &ldquo;{latestChecklist.taskText}&rdquo;
              {latestChecklist.assignmentId && (
                <span className="ml-2 text-brand-dark">· 미션 연동</span>
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {latestChecklist.relevantDnaIds.map((id) => (
                <Tag key={id} tone="brand">
                  {DNA_MAP.get(id)?.label}
                </Tag>
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink">
              {latestChecklist.rationale}
            </p>

            <div className="mt-4 space-y-2">
              {latestChecklist.guides.map((guide) => {
                const done = latestChecklist.practicedGuideIds.includes(
                  guide.id
                );
                return (
                  <label
                    key={guide.id}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-sm transition-colors ${
                      done
                        ? "border-stable/30 bg-stable-soft/60 text-ink-soft"
                        : "border-line bg-white text-ink hover:border-brand/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() =>
                        practiceGuide(latestChecklist.id, guide.id)
                      }
                      className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-brand)]"
                    />
                    <span className={done ? "line-through" : ""}>
                      {guide.text}
                    </span>
                    <Tag tone="neutral" className="ml-auto shrink-0">
                      {DNA_MAP.get(guide.dnaId)?.shortLabel}
                    </Tag>
                  </label>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-ink-faint">
              {latestChecklist.practicedGuideIds.length}/
              {latestChecklist.guides.length}개 완료 · 다시 누르면 체크가
              해제됩니다.
            </p>
            {latestChecklist.assignmentId && (
              <div className="mt-3">
                <Link href="/journey/missions">
                  <SecondaryButton>체크인 · AI 피드백으로</SecondaryButton>
                </Link>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}


export default function AiBuddyGuidePage() {
  return (
    <Suspense
      fallback={
        <Card>
          <p className="text-sm text-ink-soft">가이드를 불러오는 중…</p>
        </Card>
      }
    >
      <AiBuddyGuidePageInner />
    </Suspense>
  );
}
