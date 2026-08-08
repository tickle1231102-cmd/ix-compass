"use client";

import { useMemo, useState } from "react";
import { anonymizeFeedback } from "@/lib/ai";
import { useStore } from "@/lib/store";
import {
  getAnonymousFeedbackPosts,
  getPersonalPosts,
} from "@/lib/selectors";
import {
  Card,
  Eyebrow,
  PrimaryButton,
  SecondaryButton,
  Tag,
} from "@/components/ui";

type Step = "write" | "anonymize" | "done";

const STEPS: { id: Step; label: string }[] = [
  { id: "write", label: "작성" },
  { id: "anonymize", label: "AI 익명화" },
  { id: "done", label: "완료" },
];

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function buildBody(summary: string[], strategies: string[]): string {
  const cleanSummary = summary.map((s) => s.trim()).filter(Boolean);
  const cleanStrategies = strategies.map((s) => s.trim()).filter(Boolean);
  return [...cleanSummary, "", ...cleanStrategies].join("\n").trim();
}

export default function AnonymousFeedbackPage() {
  const { state, session, currentEmployeeId, addCommunityPost } = useStore();
  const isHr = session?.role === "hr";

  const [step, setStep] = useState<Step>("write");
  const [draft, setDraft] = useState("");
  const [summary, setSummary] = useState<string[]>([]);
  const [strategies, setStrategies] = useState<string[]>([]);

  const sentFeedbacks = useMemo(() => {
    if (!currentEmployeeId) return [];
    return getPersonalPosts(state, currentEmployeeId).filter(
      (p) =>
        p.anonymous &&
        p.authorId === currentEmployeeId &&
        p.title === "익명 피드백"
    );
  }, [state, currentEmployeeId]);

  function runAnonymize() {
    const text = draft.trim();
    if (!text) return;
    const result = anonymizeFeedback(text);
    setSummary(result.summary);
    setStrategies(
      result.strategies.length > 0 ? [...result.strategies] : [""]
    );
    setStep("anonymize");
  }

  function updateStrategy(index: number, value: string) {
    setStrategies((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function addStrategy() {
    setStrategies((prev) => [...prev, ""]);
  }

  function removeStrategy(index: number) {
    setStrategies((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  }

  function sendToHr() {
    if (!currentEmployeeId) return;
    const body = buildBody(summary, strategies);
    if (!body) return;
    addCommunityPost({
      channel: "personal",
      body,
      anonymous: true,
      peerEmployeeId: currentEmployeeId,
      title: "익명 피드백",
    });
    setDraft("");
    setSummary([]);
    setStrategies([]);
    setStep("done");
  }

  function discardAndRewrite() {
    setSummary([]);
    setStrategies([]);
    setStep("write");
  }

  function resetFlow() {
    setDraft("");
    setSummary([]);
    setStrategies([]);
    setStep("write");
  }

  if (isHr) {
    return <HrAnonymousInbox />;
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const canSend = buildBody(summary, strategies).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Anonymous Feedback</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">익명 피드백</h3>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
          작성 후 AI 익명화로 핵심 요약과 해소 전략을 확인하세요. 전략은 직접
          수정한 뒤 보낼지 결정할 수 있습니다.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2">
        {STEPS.map((s, i) => {
          const active = s.id === step;
          const done = i < stepIndex;
          return (
            <span
              key={s.id}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                active
                  ? "bg-brand text-white"
                  : done
                    ? "bg-ink text-white"
                    : "border border-line text-ink-faint"
              }`}
            >
              {i + 1}. {s.label}
            </span>
          );
        })}
      </nav>

      {step === "write" && (
        <Card>
          <Eyebrow>작성</Eyebrow>
          <h4 className="mt-1 text-base font-bold text-ink">
            인사팀에 전하고 싶은 말
          </h4>
          <p className="mt-1 text-xs text-ink-faint">
            평소 말투 그대로 적어도 됩니다. 다음 단계에서 AI가 익명화합니다.
          </p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={7}
            placeholder="예: 온보딩 일정이 너무 촘촘해서 소화할 시간이 부족해요. 버디와의 1:1도 더 자주 있으면 좋겠어요."
            className="mt-4 w-full rounded-xl border border-line px-3.5 py-3 text-sm leading-relaxed text-ink outline-none focus:border-brand"
          />
          <div className="mt-4">
            <PrimaryButton onClick={runAnonymize} disabled={!draft.trim()}>
              AI 익명화
            </PrimaryButton>
          </div>
        </Card>
      )}

      {step === "anonymize" && (
        <div className="space-y-4">
          <Card>
            <Eyebrow>원문 (나만 봄)</Eyebrow>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">
              {draft}
            </p>
          </Card>

          <Card className="border-brand/30 bg-brand-softer/30">
            <Eyebrow>AI 익명화</Eyebrow>

            <div className="mt-4">
              <p className="text-xs font-semibold text-ink-faint">핵심 요약</p>
              <ul className="mt-2 space-y-1.5">
                {summary.map((line) => (
                  <li key={line} className="text-sm leading-relaxed text-ink">
                    · {line}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-ink-faint">
                  해소 전략 제안
                </p>
                <button
                  type="button"
                  onClick={addStrategy}
                  className="text-xs font-semibold text-brand-dark hover:underline"
                >
                  + 전략 추가
                </button>
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                내용을 직접 수정한 뒤 전송 여부를 선택하세요.
              </p>
              <div className="mt-3 space-y-2">
                {strategies.map((line, index) => (
                  <div key={index} className="flex gap-2">
                    <textarea
                      value={line}
                      onChange={(e) => updateStrategy(index, e.target.value)}
                      rows={2}
                      placeholder="해소 전략을 입력하세요"
                      className="min-w-0 flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm leading-relaxed text-ink outline-none focus:border-brand"
                    />
                    <button
                      type="button"
                      onClick={() => removeStrategy(index)}
                      className="shrink-0 self-start rounded-full border border-line px-2.5 py-1 text-xs text-ink-faint hover:border-alert hover:text-alert"
                      aria-label="전략 삭제"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <SecondaryButton onClick={discardAndRewrite}>
                전송 안 함 · 다시 작성
              </SecondaryButton>
              <PrimaryButton onClick={sendToHr} disabled={!canSend}>
                인사팀에 전송
              </PrimaryButton>
            </div>
          </Card>
        </div>
      )}

      {step === "done" && (
        <Card>
          <h4 className="text-lg font-bold text-ink">
            익명 피드백이 전달됐어요
          </h4>
          <p className="mt-2 text-sm text-ink-soft">
            인사팀은 익명으로만 확인합니다. 작성자 정보는 노출되지 않아요.
          </p>
          <div className="mt-4">
            <PrimaryButton onClick={resetFlow}>새 피드백 작성</PrimaryButton>
          </div>
        </Card>
      )}

      {sentFeedbacks.length > 0 && step === "write" && (
        <div className="space-y-3">
          <Eyebrow>내가 보낸 익명 피드백</Eyebrow>
          {sentFeedbacks.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center gap-2">
                <Tag tone="neutral">익명 · 전송됨</Tag>
                <span className="text-xs text-ink-faint">
                  {formatTime(p.createdAt)}
                </span>
              </div>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-ink-soft">
                {p.body}
              </pre>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function HrAnonymousInbox() {
  const { state } = useStore();
  const posts = useMemo(() => getAnonymousFeedbackPosts(state), [state]);

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>HR · Anonymous Inbox</Eyebrow>
        <h3 className="mt-1 text-lg font-bold text-ink">익명 피드백</h3>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-soft">
          신규입사자가 AI 익명화로 보낸 의견입니다. 작성자 이름·팀·원문은
          보이지 않으며, 핵심 요약과 해소 전략만 확인합니다.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Tag tone="brand">접수 {posts.length}건</Tag>
        <Tag tone="neutral">작성자 비공개</Tag>
      </div>

      {posts.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-soft">
            아직 접수된 익명 피드백이 없어요.
          </p>
        </Card>
      ) : (
        <ul className="space-y-3">
          {posts.map((post, index) => {
            const lines = post.body
              .split("\n")
              .map((l) => l.trim())
              .filter(Boolean);
            const blankIdx = post.body.indexOf("\n\n");
            const summaryLines =
              blankIdx >= 0
                ? post.body
                    .slice(0, blankIdx)
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean)
                : lines;
            const strategyLines =
              blankIdx >= 0
                ? post.body
                    .slice(blankIdx)
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean)
                : [];

            return (
              <li key={post.id}>
                <Card>
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag tone="brand">익명 #{posts.length - index}</Tag>
                    <span className="text-xs text-ink-faint">
                      {formatTime(post.createdAt)}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold text-ink-faint">
                      핵심 요약
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {summaryLines.map((line) => (
                        <li
                          key={line}
                          className="text-sm leading-relaxed text-ink"
                        >
                          · {line}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {strategyLines.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold text-ink-faint">
                        해소 전략 제안
                      </p>
                      <ul className="mt-1.5 space-y-1">
                        {strategyLines.map((line) => (
                          <li
                            key={line}
                            className="text-sm leading-relaxed text-ink-soft"
                          >
                            · {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
