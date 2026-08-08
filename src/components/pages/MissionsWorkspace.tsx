"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { DNA_MAP } from "@/lib/seed";
import {
  ACCEPT_DELIVERABLES,
  fileToAttachment,
  formatFileSize,
  makeTextAttachment,
} from "@/lib/mission-attachments";
import {
  computeAssignmentProgressPct,
  getActiveAssignmentForEmployee,
  getAssignmentsForEmployee,
  getCheckInsForAssignment,
  getEmployeeById,
  getFeedbackForAssignment,
  getGuidesForAssignment,
} from "@/lib/selectors";
import type { MissionAttachment } from "@/lib/types";
import {
  Card,
  Eyebrow,
  PrimaryButton,
  ProgressBar,
  RiskTag,
  Tag,
} from "@/components/ui";

const STEPS = [
  { id: "mission", label: "미션" },
  { id: "guide", label: "실천" },
  { id: "submit", label: "제출" },
] as const;

export default function NewhireMissionsPage() {
  const router = useRouter();
  const {
    state,
    session,
    currentEmployeeId,
    submitMissionCheckIn,
    runContextChecklist,
    practiceGuide,
  } = useStore();

  useEffect(() => {
    if (session?.role === "hr") {
      router.replace("/journey/missions/manage");
    }
  }, [session, router]);

  const me = getEmployeeById(state, currentEmployeeId);
  const active = getActiveAssignmentForEmployee(state, currentEmployeeId);
  const all = getAssignmentsForEmployee(state, currentEmployeeId);

  const [privateNote, setPrivateNote] = useState("");
  const [textBody, setTextBody] = useState("");
  const [files, setFiles] = useState<MissionAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [freeGuideOpen, setFreeGuideOpen] = useState(false);
  const autoRanFor = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const deliverableErrorId = "mission-deliverable-error";

  useEffect(() => {
    setPrivateNote("");
    setTextBody("");
    setFiles([]);
    setSubmitError("");
    setJustSubmitted(false);
    setEditTaskOpen(false);
    if (active) {
      setTaskInput(`${active.title} — ${active.description}`);
    } else {
      setTaskInput("");
    }
  }, [active?.id]);

  const progressPct = active
    ? computeAssignmentProgressPct(state, active.id)
    : 0;
  const feedback = active
    ? getFeedbackForAssignment(state, active.id)
    : undefined;
  const assignmentGuides = active
    ? getGuidesForAssignment(state, active.id)
    : [];
  const latestChecklist = assignmentGuides[0];
  const guidePracticed = latestChecklist
    ? latestChecklist.practicedGuideIds.length
    : 0;

  const latestCheckIn = active
    ? getCheckInsForAssignment(state, active.id)[0]
    : undefined;

  const canSubmit = files.length > 0 || Boolean(textBody.trim());

  // 제출 완료 = AI 피드백까지 낸 뒤 (awaiting_review | completed).
  // 시드의 중간 체크인만으로는 체크하지 않음.
  const stepDone = useMemo(
    () => ({
      mission: Boolean(active),
      guide: guidePracticed > 0,
      submit:
        active?.status === "awaiting_review" ||
        active?.status === "completed",
    }),
    [active, guidePracticed, active?.status]
  );

  // Auto-recommend when mission has no checklist yet
  useEffect(() => {
    if (!active || !me) return;
    if (latestChecklist) {
      autoRanFor.current = active.id;
      return;
    }
    if (autoRanFor.current === active.id) return;
    const text = `${active.title} — ${active.description}`.trim();
    if (!text) return;
    autoRanFor.current = active.id;
    runContextChecklist(active.week, text, active.id);
  }, [active?.id, latestChecklist?.id, me, runContextChecklist, active]);

  // Hash deep-link (#guide | #submit | #mission | #feedback)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    const id = ["mission", "guide", "submit", "feedback"].includes(hash)
      ? hash
      : null;
    if (!id) return;
    requestAnimationFrame(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [active?.id]);

  useEffect(() => {
    if (!justSubmitted || !feedback) return;
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [justSubmitted, feedback?.id]);

  if (session?.role === "hr") {
    return (
      <Card>
        <p className="text-sm text-ink-soft">미션 배정 화면으로 이동 중…</p>
      </Card>
    );
  }

  if (!me) return null;

  function scrollToStep(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function handleFilesSelected(list: FileList | null) {
    if (!list || list.length === 0) return;
    setSubmitError("");
    try {
      const next = await Promise.all(
        Array.from(list).map((file) => fileToAttachment(file))
      );
      setFiles((prev) => [...prev, ...next]);
    } catch {
      setSubmitError("파일을 읽지 못했어요. 다시 시도해 주세요.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function handleRunChecklist(assignmentId?: string, week?: number) {
    const text = taskInput.trim();
    if (!text) return;
    runContextChecklist(
      week ?? active?.week ?? (me!.weekNumber || 3),
      text,
      assignmentId ?? active?.id
    );
    setEditTaskOpen(false);
  }

  async function handleSubmitForFeedback() {
    if (!active) return;
    const textAtt = makeTextAttachment(textBody);
    const attachments = [...files, ...(textAtt ? [textAtt] : [])];
    if (attachments.length === 0) {
      setSubmitError(
        "PDF·워드·텍스트 등 결과물을 하나 이상 첨부하거나 작성해 주세요."
      );
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      submitMissionCheckIn({
        assignmentId: active.id,
        privateNote: privateNote.trim() || undefined,
        attachments,
        generateFeedback: true,
      });
      setTextBody("");
      setFiles([]);
      setPrivateNote("");
      setJustSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>미션 수행</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">이번 주 미션</h3>
      </div>

      {active && (
        <nav
          aria-label="미션 수행 단계"
          className="sticky top-[4.25rem] z-20 -mx-1 flex gap-1 rounded-2xl border border-line bg-white/95 p-1.5 shadow-sm backdrop-blur"
        >
          {STEPS.map((step, i) => {
            const done = stepDone[step.id];
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => scrollToStep(step.id)}
                className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 text-xs font-bold transition-colors sm:text-sm ${
                  done
                    ? "bg-stable-soft text-stable"
                    : "text-ink-soft hover:bg-line-soft hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    done
                      ? "bg-stable text-white"
                      : "bg-line-soft text-ink-soft"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                {step.label}
              </button>
            );
          })}
        </nav>
      )}

      {!active ? (
        <>
          <Card id="mission">
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

          <Card>
            <button
              type="button"
              onClick={() => setFreeGuideOpen((o) => !o)}
              className="flex min-h-11 w-full items-center justify-between text-left"
            >
              <span className="font-bold text-ink">자유 실천 체크</span>
              <span className="text-sm text-ink-soft">
                {freeGuideOpen ? "접기" : "펼치기"}
              </span>
            </button>
            {freeGuideOpen && (
              <div className="mt-4 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRunChecklist();
                    }}
                    placeholder="오늘 할 일을 적어 주세요"
                    className="flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
                  />
                  <PrimaryButton
                    onClick={() => handleRunChecklist()}
                    disabled={!taskInput.trim()}
                  >
                    추천 받기
                  </PrimaryButton>
                </div>
              </div>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card id="mission">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag tone="brand">{active.week}주차</Tag>
                  {active.priority === "high" && (
                    <Tag tone="watch">우선</Tag>
                  )}
                </div>
                <h3 className="mt-2 text-xl font-bold text-ink">
                  {active.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-soft">
                  {active.description}
                </p>
                <p className="mt-2 text-xs text-ink-soft">
                  마감 {new Date(active.dueAt).toLocaleDateString("ko-KR")}
                  {active.dnaFocus.length > 0 && (
                    <>
                      {" · "}
                      {active.dnaFocus
                        .map((id) => DNA_MAP.get(id)?.shortLabel ?? id)
                        .join(", ")}
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-soft">진행률</p>
                <p className="text-2xl font-bold text-ink">{progressPct}%</p>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar value={progressPct} />
            </div>
          </Card>

          <Card id="guide">
            <Eyebrow>실천 체크</Eyebrow>
            <h4 className="mt-1 font-bold text-ink">AI로 실천하기</h4>

            <details
              className="mt-3"
              open={editTaskOpen}
              onToggle={(e) =>
                setEditTaskOpen((e.target as HTMLDetailsElement).open)
              }
            >
              <summary className="cursor-pointer list-none text-sm font-semibold text-brand-dark marker:content-none [&::-webkit-details-marker]:hidden">
                오늘 할 일 수정
              </summary>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRunChecklist(active.id);
                  }}
                  className="flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-brand"
                />
                <PrimaryButton
                  onClick={() => handleRunChecklist(active.id)}
                  disabled={!taskInput.trim()}
                >
                  {latestChecklist ? "다시 추천" : "추천 받기"}
                </PrimaryButton>
              </div>
            </details>

            {!latestChecklist && (
              <div className="mt-4">
                <PrimaryButton
                  onClick={() => handleRunChecklist(active.id)}
                  disabled={!taskInput.trim()}
                >
                  추천 받기
                </PrimaryButton>
              </div>
            )}

            {latestChecklist && (
              <div className="mt-4 rounded-xl border border-line-soft bg-line-soft/50 p-4">
                <div className="flex flex-wrap gap-1.5">
                  {latestChecklist.relevantDnaIds.map((id) => {
                    const dna = DNA_MAP.get(id);
                    return (
                      <Tag key={id} tone="brand">
                        {dna?.emoji ? `${dna.emoji} ` : ""}
                        {dna?.label ?? id}
                      </Tag>
                    );
                  })}
                </div>

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
                          {DNA_MAP.get(guide.dnaId)?.emoji
                            ? `${DNA_MAP.get(guide.dnaId)?.emoji} `
                            : ""}
                          {DNA_MAP.get(guide.dnaId)?.shortLabel}
                        </Tag>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>

          <Card id="submit">
            <Eyebrow>결과물</Eyebrow>
            <h4 className="mt-1 font-bold text-ink">결과물 제출</h4>
            <p className="mt-1 text-sm text-ink-soft">
              다시 제출하면 이전 제출을 대체하고 새 피드백을 생성합니다.
            </p>

            <div className="mt-4">
              <input
                ref={fileInputRef}
                id="mission-file-input"
                type="file"
                multiple
                accept={ACCEPT_DELIVERABLES}
                className="sr-only"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-controls="mission-file-input"
                className={`w-full min-h-11 rounded-xl border border-dashed px-4 py-6 text-center text-sm font-semibold transition-colors hover:border-brand hover:text-brand-dark ${
                  submitError
                    ? "border-alert text-alert"
                    : "border-line text-ink-soft"
                }`}
              >
                파일 첨부 (PDF · Word · 텍스트)
                {files.length > 0 ? ` · ${files.length}개 선택됨` : ""}
              </button>
            </div>

            {files.length > 0 && (
              <ul className="mt-3 space-y-2" aria-label="첨부된 파일">
                {files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-line-soft px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{f.name}</p>
                      <p className="text-xs text-ink-soft">
                        {f.kind.toUpperCase()} · {formatFileSize(f.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="min-h-11 shrink-0 px-2 text-xs font-semibold text-alert"
                    >
                      제거
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <label className="mt-4 block">
              <span className="text-xs font-medium text-ink-soft">
                텍스트 결과물 (선택)
              </span>
              <textarea
                value={textBody}
                onChange={(e) => {
                  setTextBody(e.target.value);
                  if (submitError) setSubmitError("");
                }}
                rows={5}
                aria-invalid={Boolean(submitError) || undefined}
                aria-describedby={submitError ? deliverableErrorId : undefined}
                placeholder="미션 결과 요약, 회고, 산출물 본문 등을 붙여 넣으세요."
                className={`mt-1 w-full rounded-xl border px-3.5 py-2.5 text-sm focus:border-brand ${
                  submitError ? "border-alert" : "border-line"
                }`}
              />
            </label>

            <label className="mt-3 block">
              <span className="text-xs font-medium text-ink-soft">
                막힌 점 · AI 전용 프라이빗 노트 (인사팀 비공개)
              </span>
              <textarea
                value={privateNote}
                onChange={(e) => setPrivateNote(e.target.value)}
                rows={2}
                placeholder="솔직한 어려움은 여기에만 남겨 주세요."
                className="mt-1 w-full rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-brand"
              />
            </label>

            {submitError && (
              <p
                id={deliverableErrorId}
                className="mt-3 text-sm font-medium text-alert"
                role="alert"
              >
                {submitError}
              </p>
            )}

            <div className="mt-4">
              <PrimaryButton
                onClick={handleSubmitForFeedback}
                disabled={!canSubmit}
                busy={submitting}
              >
                {submitting ? "제출 중…" : "제출하고 AI 피드백 받기"}
              </PrimaryButton>
            </div>

            {latestCheckIn?.attachments &&
              latestCheckIn.attachments.length > 0 && (
                <div className="mt-4 rounded-xl border border-line-soft bg-line-soft/40 px-3 py-2.5">
                  <p className="text-xs font-semibold text-ink-soft">
                    최근 제출 결과물
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {latestCheckIn.attachments.map((a) => (
                      <li key={a.id} className="text-xs text-ink-soft">
                        · {a.name} ({a.kind}, {formatFileSize(a.size)})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </Card>

          {justSubmitted && feedback && (
            <div
              role="status"
              className="rounded-xl border border-stable/30 bg-stable-soft px-4 py-3 text-sm font-semibold text-stable"
            >
              AI 피드백이 생성됐어요. 아래에서 확인하세요.
            </div>
          )}

          {feedback && (
            <div id="feedback" ref={feedbackRef}>
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

                <details className="mt-5 rounded-xl border border-line-soft bg-line-soft/40 p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 marker:content-none [&::-webkit-details-marker]:hidden">
                    <p className="text-xs font-semibold text-ink-soft">
                      인사팀에 전달되는 내용 미리보기
                    </p>
                    <RiskTag level={feedback.forHr.riskLevel} />
                  </summary>
                  <p className="mt-2 text-sm text-ink-soft">
                    {feedback.forHr.summary}
                  </p>
                  <p className="mt-2 text-xs text-brand-dark">
                    → {feedback.forHr.interventionHint}
                  </p>
                  <p className="mt-2 text-xs text-ink-soft">
                    진행 {feedback.forHr.progressPct}% · 결과물{" "}
                    {feedback.forHr.artifactCount}건 · 가이드 실천{" "}
                    {feedback.forHr.practicedGuideCount}건
                  </p>
                </details>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
