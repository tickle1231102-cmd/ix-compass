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
  PrimaryButton,
  ProgressBar,
  RiskTag,
  Tag,
} from "@/components/ui";

const STEPS = [
  { id: "mission", label: "미션" },
  { id: "guide", label: "가이드" },
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
  const [editTaskOpen, setEditTaskOpen] = useState(true);
  const [freeGuideOpen, setFreeGuideOpen] = useState(true);
  const [focusStep, setFocusStep] = useState<(typeof STEPS)[number]["id"]>(
    "mission"
  );
  const autoRanFor = useRef<string | null>(null);
  const prevGuideDone = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const deliverableErrorId = "mission-deliverable-error";

  const STEP_SCROLL_MT = "!scroll-mt-32";

  useEffect(() => {
    setPrivateNote("");
    setTextBody("");
    setFiles([]);
    setSubmitError("");
    setJustSubmitted(false);
    setEditTaskOpen(true);
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

  const guideTotal = latestChecklist?.guides.length ?? 0;
  /** 실천 완료 = 추천 가이드를 모두 체크했을 때만 */
  const guideDone = guideTotal > 0 && guidePracticed >= guideTotal;
  /** 제출 완료 = 실천 완료 후 AI 피드백이 생성된 경우만 */
  const submitDone = guideDone && Boolean(feedback);
  const missionComplete = active?.status === "completed";
  const submitUnlocked = guideDone;
  const canSubmit =
    submitUnlocked && (files.length > 0 || Boolean(textBody.trim()));

  const stepDone = useMemo(
    () => ({
      mission: Boolean(active),
      guide: guideDone,
      submit: submitDone,
    }),
    [active, guideDone, submitDone]
  );

  const stepLocked = useMemo(
    () => ({
      mission: false,
      guide: false,
      submit: !submitUnlocked,
    }),
    [submitUnlocked]
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

    function scrollToHash(behavior: ScrollBehavior = "smooth") {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;
      const id = ["mission", "guide", "submit", "feedback"].includes(hash)
        ? hash
        : null;
      if (!id) return;
      let target = id;
      if (id === "submit" && !guideDone) {
        target = "guide";
      }
      if (target === "mission" || target === "guide" || target === "submit") {
        setFocusStep(target);
      }
      const run = (attempt: number) => {
        const el = document.getElementById(target!);
        if (el) {
          el.scrollIntoView({ behavior, block: "start" });
          return;
        }
        if (attempt < 8) {
          window.setTimeout(() => run(attempt + 1), 50);
        }
      };
      requestAnimationFrame(() => run(0));
    }

    scrollToHash("smooth");
    const onHash = () => scrollToHash("smooth");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [active?.id, latestChecklist?.id, guideDone]);

  useEffect(() => {
    if (!justSubmitted || !feedback) return;
    setFocusStep("submit");
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [justSubmitted, feedback?.id]);

  // Guide complete → reveal submit with scroll + focus
  useEffect(() => {
    if (guideDone && !prevGuideDone.current && !submitDone) {
      setFocusStep("submit");
      requestAnimationFrame(() => {
        submitRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", "#submit");
        }
      });
    }
    prevGuideDone.current = guideDone;
  }, [guideDone, submitDone]);

  useEffect(() => {
    prevGuideDone.current = false;
  }, [active?.id]);

  if (session?.role === "hr") {
    return (
      <Card>
        <p className="text-sm text-ink-soft">미션 배정 화면으로 이동 중…</p>
      </Card>
    );
  }

  if (!me) return null;

  function scrollToStep(id: (typeof STEPS)[number]["id"]) {
    const target =
      id === "submit" && !guideDone ? ("guide" as const) : id;
    setFocusStep(target);
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${target}`);
    }
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
      week ?? active?.week ?? (me!.weekNumber || 1),
      text,
      assignmentId ?? active?.id
    );
    setEditTaskOpen(false);
  }

  async function handleSubmitForFeedback() {
    if (!active) return;
    if (!guideDone) {
      setSubmitError("실천 항목을 모두 체크한 뒤 제출할 수 있어요.");
      scrollToStep("guide");
      return;
    }
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
    <div className="space-y-2.5">
      {active && (
        <nav
          aria-label="미션 수행 단계"
          className="sticky top-[4.25rem] z-20 flex gap-1 rounded-xl border border-line bg-white/95 p-1 shadow-sm backdrop-blur"
        >
          {STEPS.map((step, i) => {
            const done = stepDone[step.id];
            const locked = stepLocked[step.id];
            const focused = focusStep === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => scrollToStep(step.id)}
                aria-current={focused ? "step" : undefined}
                aria-disabled={locked || undefined}
                title={
                  locked ? "실천을 먼저 완료해 주세요" : undefined
                }
                className={`flex min-h-8 flex-1 items-center justify-center gap-1 rounded-lg px-2 text-xs font-bold transition-colors ${
                  locked
                    ? "cursor-not-allowed text-ink-faint opacity-60"
                    : focused
                      ? "bg-brand-soft text-brand-dark ring-1 ring-brand/30"
                      : done
                        ? "bg-stable-soft text-stable"
                        : "text-ink-soft hover:bg-line-soft hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                    done
                      ? "bg-stable text-white"
                      : locked
                        ? "bg-line text-ink-faint"
                        : focused
                          ? "bg-brand text-white"
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
            <p className="text-sm text-ink-soft">배정된 미션이 없어요.</p>
            {all.length > 0 && (
              <ul className="mt-2 space-y-1">
                {all.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-line-soft px-2.5 py-1.5 text-sm"
                  >
                    <span className="truncate font-semibold text-ink">
                      {a.week}주차 · {a.title}
                    </span>
                    <Tag tone="neutral">{a.status}</Tag>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <button
              type="button"
              onClick={() => setFreeGuideOpen((o) => !o)}
              className="flex min-h-8 w-full items-center justify-between text-left"
            >
              <span className="text-sm font-bold text-ink">자유 실천</span>
              <span className="text-xs text-ink-soft">
                {freeGuideOpen ? "접기" : "펼치기"}
              </span>
            </button>
            {freeGuideOpen && (
              <div className="mt-2 space-y-1.5">
                <textarea
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  rows={3}
                  placeholder="오늘 할 일"
                  className="w-full resize-y rounded-lg border border-line px-2.5 py-1.5 text-sm leading-relaxed text-ink outline-none focus:border-brand"
                />
                <div className="flex justify-end">
                  <PrimaryButton
                    onClick={() => handleRunChecklist()}
                    disabled={!taskInput.trim()}
                  >
                    추천
                  </PrimaryButton>
                </div>
              </div>
            )}
          </Card>
        </>
      ) : (
        <>
          <Card id="mission" className={`${STEP_SCROLL_MT} !p-2.5`}>
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="brand">{active.week}주차</Tag>
              {active.priority === "high" && <Tag tone="watch">우선</Tag>}
              <h3 className="min-w-0 flex-1 truncate text-base font-bold text-ink">
                {active.title}
              </h3>
              <div className="shrink-0 text-right">
                <p className="text-[10px] font-medium text-ink-soft">전체 진행</p>
                <p className="text-lg font-bold tabular-nums leading-none text-ink">
                  {progressPct}%
                </p>
              </div>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-ink-soft">
              {active.description}
              {" · 마감 "}
              {new Date(active.dueAt).toLocaleDateString("ko-KR")}
              {active.dnaFocus.length > 0 && (
                <>
                  {" · "}
                  {active.dnaFocus
                    .map((id) => DNA_MAP.get(id)?.shortLabel ?? id)
                    .join(", ")}
                </>
              )}
            </p>
            <div className="mt-1.5">
              <ProgressBar value={progressPct} />
            </div>
          </Card>

          <Card id="guide" className={`${STEP_SCROLL_MT} !p-2.5`}>
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-ink">실천 가이드</h4>
              <div className="flex items-center gap-2">
                {latestChecklist && (
                  <span className="text-[11px] text-ink-soft">
                    {guidePracticed}/{latestChecklist.guides.length}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setEditTaskOpen((o) => !o)}
                  className="text-[11px] font-semibold text-brand-dark"
                >
                  {editTaskOpen ? "닫기" : "추천 수정"}
                </button>
              </div>
            </div>

            {editTaskOpen && (
              <div className="mt-1.5 space-y-1.5">
                <textarea
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  rows={Math.min(
                    8,
                    Math.max(3, taskInput.split("\n").length + 1)
                  )}
                  className="w-full resize-y rounded-lg border border-line px-2.5 py-1.5 text-sm leading-relaxed text-ink outline-none focus:border-brand"
                />
                <div className="flex justify-end">
                  <PrimaryButton
                    onClick={() => handleRunChecklist(active.id)}
                    disabled={!taskInput.trim()}
                  >
                    {latestChecklist ? "다시 추천" : "추천"}
                  </PrimaryButton>
                </div>
              </div>
            )}

            {!latestChecklist && !editTaskOpen && (
              <div className="mt-2">
                <PrimaryButton
                  onClick={() => handleRunChecklist(active.id)}
                  disabled={!taskInput.trim()}
                >
                  추천
                </PrimaryButton>
              </div>
            )}

            {latestChecklist && (
              <>
                {latestChecklist.rationale && (
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-ink-soft">
                    {latestChecklist.rationale}
                  </p>
                )}
                <ul className="mt-2 space-y-1">
                  {latestChecklist.guides.map((guide) => {
                    const done = latestChecklist.practicedGuideIds.includes(
                      guide.id
                    );
                    return (
                      <li key={guide.id}>
                        <label
                          className={`flex cursor-pointer items-start gap-2 rounded-lg border px-2 py-1.5 text-sm transition-colors ${
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
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--color-brand)]"
                          />
                          <span
                            className={`min-w-0 flex-1 whitespace-pre-wrap break-words leading-relaxed ${
                              done ? "line-through" : ""
                            }`}
                          >
                            {guide.text}
                          </span>
                          <Tag
                            tone="neutral"
                            className="ml-auto shrink-0 !px-1.5 !py-0.5 !text-[10px]"
                          >
                            {DNA_MAP.get(guide.dnaId)?.shortLabel}
                          </Tag>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </Card>

          <div ref={submitRef}>
            <Card
              id="submit"
              className={`${STEP_SCROLL_MT} !p-2.5 ${
                submitUnlocked ? "ring-1 ring-brand/30" : ""
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-bold text-ink">제출</h4>
                {submitDone ? (
                  <Tag tone={missionComplete ? "stable" : "watch"}>
                    {missionComplete
                      ? "미션 완료"
                      : "제출됨 · 인사 피드백 대기"}
                  </Tag>
                ) : submitUnlocked ? (
                  <Tag tone="brand">가이드 완료 · 결과물 제출</Tag>
                ) : (
                  <span className="text-[11px] text-ink-soft">
                    가이드{" "}
                    {guideTotal > 0
                      ? `${guidePracticed}/${guideTotal}`
                      : "—"}{" "}
                    완료 후 제출 가능
                  </span>
                )}
              </div>

              <div
                className={
                  submitUnlocked
                    ? "mt-2"
                    : "mt-2 pointer-events-none opacity-50"
                }
              >
                <input
                  ref={fileInputRef}
                  id="mission-file-input"
                  type="file"
                  multiple
                  accept={ACCEPT_DELIVERABLES}
                  className="sr-only"
                  disabled={!submitUnlocked}
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!submitUnlocked}
                  aria-controls="mission-file-input"
                  className={`w-full min-h-8 rounded-lg border border-dashed px-3 py-2 text-center text-xs font-semibold transition-colors ${
                    !submitUnlocked
                      ? "cursor-not-allowed border-line text-ink-faint"
                      : submitError
                        ? "border-alert text-alert hover:border-brand hover:text-brand-dark"
                        : "border-line text-ink-soft hover:border-brand hover:text-brand-dark"
                  }`}
                >
                  파일 첨부
                  {files.length > 0 ? ` · ${files.length}` : ""}
                </button>

                {files.length > 0 && (
                  <ul className="mt-1.5 space-y-1" aria-label="첨부된 파일">
                    {files.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-line-soft px-2 py-1 text-xs"
                      >
                        <span className="min-w-0 flex-1 break-words font-semibold text-ink">
                          {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(f.id)}
                          className="shrink-0 font-semibold text-alert"
                        >
                          제거
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <textarea
                  value={textBody}
                  onChange={(e) => {
                    setTextBody(e.target.value);
                    if (submitError) setSubmitError("");
                  }}
                  rows={3}
                  disabled={!submitUnlocked}
                  aria-invalid={Boolean(submitError) || undefined}
                  aria-describedby={
                    submitError ? deliverableErrorId : undefined
                  }
                  placeholder="텍스트 결과물"
                  className={`mt-1.5 w-full rounded-lg border px-2.5 py-1.5 text-sm focus:border-brand disabled:cursor-not-allowed ${
                    submitError ? "border-alert" : "border-line"
                  }`}
                />

                <textarea
                  value={privateNote}
                  onChange={(e) => setPrivateNote(e.target.value)}
                  rows={2}
                  disabled={!submitUnlocked}
                  placeholder="프라이빗 노트 (인사 비공개)"
                  className="mt-1.5 w-full rounded-lg border border-line px-2.5 py-1.5 text-sm focus:border-brand disabled:cursor-not-allowed"
                />

                {submitError && (
                  <p
                    id={deliverableErrorId}
                    className="mt-1.5 text-xs font-medium text-alert"
                    role="alert"
                  >
                    {submitError}
                  </p>
                )}

                <div className="mt-2 pointer-events-auto">
                  <PrimaryButton
                    onClick={handleSubmitForFeedback}
                    disabled={!canSubmit}
                    busy={submitting}
                  >
                    {submitting
                      ? "제출 중…"
                      : !submitUnlocked
                        ? "가이드 완료 후 제출"
                        : submitDone
                          ? "다시 제출하기"
                          : "제출하기"}
                  </PrimaryButton>
                </div>

                {latestCheckIn?.attachments &&
                  latestCheckIn.attachments.length > 0 && (
                    <p className="mt-1.5 break-words text-[11px] text-ink-soft">
                      최근:{" "}
                      {latestCheckIn.attachments
                        .map((a) => a.name)
                        .join(", ")}
                    </p>
                  )}
              </div>
            </Card>
          </div>

          {justSubmitted && feedback && (
            <p
              role="status"
              className="rounded-lg border border-stable/30 bg-stable-soft px-3 py-2 text-xs font-semibold text-stable"
            >
              제출됨 · AI 피드백 생성 완료 · 인사 피드백 대기
            </p>
          )}

          {feedback && guideDone && (
            <div id="feedback" ref={feedbackRef}>
              <Card className="!p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-ink">피드백</h4>
                  <RiskTag level={feedback.forHr.riskLevel} />
                </div>
                <p className="mt-1.5 text-sm leading-snug text-ink">
                  {feedback.forNewhire.coachText}
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {feedback.forNewhire.nextActions.map((a, i) => (
                    <li key={i} className="text-xs text-ink-soft">
                      · {a}
                    </li>
                  ))}
                </ul>

                <details className="mt-2 rounded-lg border border-line-soft bg-line-soft/40 px-2.5 py-2">
                  <summary className="cursor-pointer list-none text-[11px] font-semibold text-ink-soft marker:content-none [&::-webkit-details-marker]:hidden">
                    인사팀 미리보기
                  </summary>
                  <p className="mt-1.5 text-xs text-ink-soft">
                    {feedback.forHr.summary}
                  </p>
                  <p className="mt-1 text-[11px] text-brand-dark">
                    → {feedback.forHr.interventionHint}
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
