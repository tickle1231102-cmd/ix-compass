"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { DNA_MAP } from "@/lib/seed";
import {
  computeAssignmentProgressPct,
  getActiveAssignmentForEmployee,
  getAssignmentsForEmployee,
  getCheckInsForAssignment,
  getEmployeeById,
  getFeedbackForAssignment,
  getGuidesForAssignment,
} from "@/lib/selectors";
import {
  Card,
  Eyebrow,
  PrimaryButton,
  ProgressBar,
  RiskTag,
  SecondaryButton,
  Tag,
} from "@/components/ui";

export default function NewhireMissionsPage() {
  const router = useRouter();
  const {
    state,
    session,
    currentEmployeeId,
    submitMissionCheckIn,
    generateMissionFeedbackFor,
  } = useStore();

  useEffect(() => {
    if (session?.role === "hr") {
      router.replace("/journey/missions/manage");
    }
  }, [session, router]);

  const me = getEmployeeById(state, currentEmployeeId);
  const active = getActiveAssignmentForEmployee(state, currentEmployeeId);
  const all = getAssignmentsForEmployee(state, currentEmployeeId);

  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [privateNote, setPrivateNote] = useState("");
  const [artifactNote, setArtifactNote] = useState("");

  useEffect(() => {
    if (!active) {
      setDoneIds([]);
      return;
    }
    const latest = getCheckInsForAssignment(state, active.id)[0];
    setDoneIds(latest?.doneCriteriaIds ?? []);
    setPrivateNote("");
    setArtifactNote("");
  }, [active?.id, state.missionCheckIns]);

  const progressPct = active
    ? computeAssignmentProgressPct(state, active.id)
    : 0;
  const feedback = active
    ? getFeedbackForAssignment(state, active.id)
    : undefined;
  const guideCount = active
    ? getGuidesForAssignment(state, active.id).reduce(
        (s, g) => s + g.practicedGuideIds.length,
        0
      )
    : 0;

  const guideHref = useMemo(() => {
    if (!active) return "/journey/guide";
    const q = new URLSearchParams({
      assignmentId: active.id,
      task: `${active.title} — ${active.description}`,
    });
    return `/journey/guide?${q.toString()}`;
  }, [active]);

  if (session?.role === "hr") {
    return (
      <Card>
        <p className="text-sm text-ink-soft">미션 배정 화면으로 이동 중…</p>
      </Card>
    );
  }

  if (!me) return null;

  function toggleCriterion(index: number) {
    const id = String(index);
    setDoneIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleCheckIn() {
    if (!active) return;
    submitMissionCheckIn({
      assignmentId: active.id,
      doneCriteriaIds: doneIds,
      privateNote: privateNote.trim() || undefined,
      artifactNote: artifactNote.trim() || undefined,
    });
    setPrivateNote("");
  }

  function handleGenerateFeedback() {
    if (!active) return;
    generateMissionFeedbackFor(active.id);
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>맞춤 미션</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">내 미션</h3>
        <p className="mt-1 text-sm text-ink-soft">
          집중 온보딩 1개월 맞춤 미션입니다. AI 가이드로 수행하고, AI 피드백만
          인사팀에 공유됩니다. 프라이빗 노트는 AI만 봅니다.
        </p>
      </div>

      {!active ? (
        <Card>
          <p className="text-sm text-ink-soft">
            아직 배정된 진행 중 미션이 없어요. 인사팀 배정을 기다려 주세요.
          </p>
          {all.length > 0 && (
            <ul className="mt-4 space-y-2">
              {all.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-line-soft px-3 py-2 text-sm"
                >
                  <span className="font-semibold text-ink">
                    {a.week}주차 · {a.title}
                  </span>
                  <Tag tone="neutral" className="ml-2">
                    {a.status}
                  </Tag>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Tag tone="brand">{active.week}주차</Tag>
                {active.priority === "high" && (
                  <Tag tone="watch" className="ml-1.5">
                    우선
                  </Tag>
                )}
                <h3 className="mt-2 text-xl font-bold text-ink">
                  {active.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {active.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-faint">진행률</p>
                <p className="text-2xl font-bold text-ink">{progressPct}%</p>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar value={progressPct} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {active.dnaFocus.map((id) => (
                <Tag key={id} tone="neutral">
                  {DNA_MAP.get(id)?.label}
                </Tag>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-faint">
              마감 {new Date(active.dueAt).toLocaleDateString("ko-KR")} · 가이드
              실천 {guideCount}건 · 상태 {active.status}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={guideHref}>
                <PrimaryButton>AI 가이드로 수행하기</PrimaryButton>
              </Link>
              <SecondaryButton onClick={handleGenerateFeedback}>
                AI 피드백 받기
              </SecondaryButton>
            </div>
          </Card>

          <Card>
            <h4 className="font-bold text-ink">성공 기준 · 체크인</h4>
            <ul className="mt-3 space-y-2">
              {active.successCriteria.map((c, i) => {
                const id = String(i);
                const done = doneIds.includes(id);
                return (
                  <label
                    key={id}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-sm ${
                      done
                        ? "border-stable/30 bg-stable-soft/60"
                        : "border-line hover:border-brand/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={done}
                      onChange={() => toggleCriterion(i)}
                      className="mt-0.5 accent-[var(--color-brand)]"
                    />
                    <span className={done ? "text-ink-soft line-through" : "text-ink"}>
                      {c}
                    </span>
                  </label>
                );
              })}
            </ul>

            <label className="mt-4 block">
              <span className="text-xs font-medium text-ink-faint">
                산출물 메모 (선택 · 구조화)
              </span>
              <input
                value={artifactNote}
                onChange={(e) => setArtifactNote(e.target.value)}
                placeholder="예: Notion 링크, 슬랙 스레드"
                className="mt-1 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
              />
            </label>

            <label className="mt-3 block">
              <span className="text-xs font-medium text-ink-faint">
                막힌 점 · AI 전용 프라이빗 노트 (인사팀 비공개)
              </span>
              <textarea
                value={privateNote}
                onChange={(e) => setPrivateNote(e.target.value)}
                rows={3}
                placeholder="솔직한 어려움은 여기에만 남겨 주세요. 원문은 인사팀에 전달되지 않습니다."
                className="mt-1 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand"
              />
            </label>

            <div className="mt-3">
              <PrimaryButton onClick={handleCheckIn}>체크인 저장</PrimaryButton>
            </div>
          </Card>

          {feedback && (
            <Card>
              <Eyebrow>AI 피드백</Eyebrow>
              <h4 className="mt-1 font-bold text-ink">코치 피드백</h4>
              <p className="mt-2 text-sm leading-relaxed text-ink">
                {feedback.forNewhire.coachText}
              </p>
              <ul className="mt-3 space-y-1.5">
                {feedback.forNewhire.nextActions.map((a, i) => (
                  <li key={i} className="text-sm text-ink-soft">
                    · {a}
                  </li>
                ))}
              </ul>

              <div className="mt-5 rounded-xl border border-line-soft bg-line-soft/40 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-ink-faint">
                    인사팀에 전달되는 내용 미리보기
                  </p>
                  <RiskTag level={feedback.forHr.riskLevel} />
                </div>
                <p className="mt-2 text-sm text-ink-soft">
                  {feedback.forHr.summary}
                </p>
                <p className="mt-2 text-xs text-brand-dark">
                  → {feedback.forHr.interventionHint}
                </p>
                <p className="mt-2 text-xs text-ink-faint">
                  진행 {feedback.forHr.progressPct}% · 성공 기준{" "}
                  {feedback.forHr.criteriaDone}/
                  {feedback.forHr.criteriaTotal} · 가이드 실천{" "}
                  {feedback.forHr.practicedGuideCount}건
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
