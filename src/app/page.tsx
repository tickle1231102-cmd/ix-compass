"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { CHECKLIST_STAGE_LABEL, DEMO_TODAY, SCENARIOS } from "@/lib/seed";
import {
  computeAssignmentProgressPct,
  getActiveAssignmentForEmployee,
  getChecklistStats,
  getDraftOkrForEmployee,
  getEmployeeById,
  getHrMissionReviewQueue,
  getMissionRiskSignalsForEmployee,
  getTodayEvents,
  getUncheckedChecklistItems,
  searchLibraryDocs,
} from "@/lib/selectors";
import { computeRiskNote, evaluateSimulatorAnswer } from "@/lib/ai";
import {
  Card,
  Eyebrow,
  PrimaryButton,
  ProgressBar,
  RiskTag,
  SecondaryButton,
  SectionHeading,
  Tag,
} from "@/components/ui";
import type { ChecklistStage } from "@/lib/types";

const STAGES: ChecklistStage[] = [
  "day1",
  "week1",
  "month1",
  "day60",
  "day90",
];

export default function DashboardPage() {
  const {
    state,
    session,
    currentEmployeeId,
    submitSimulatorAnswer,
  } = useStore();

  const isHr = session?.role === "hr";
  const me = getEmployeeById(state, currentEmployeeId);
  const stats = getChecklistStats(state, currentEmployeeId);
  const unchecked = getUncheckedChecklistItems(state, currentEmployeeId, 3);
  const todayEvents = getTodayEvents(state, currentEmployeeId, DEMO_TODAY);
  const docs = searchLibraryDocs("온보딩").slice(0, 2);

  const scenario = SCENARIOS[0];
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const [simDone, setSimDone] = useState(false);
  const [simFeedback, setSimFeedback] = useState("");

  const attempt = state.simulatorAttempts.find(
    (a) => a.employeeId === currentEmployeeId && a.scenarioId === scenario.id
  );

  function runScenario() {
    if (!choiceId) return;
    const choice = scenario.choices.find((c) => c.id === choiceId);
    if (!choice) return;
    submitSimulatorAnswer(scenario.id, choiceId, choice.label);
    setSimFeedback(evaluateSimulatorAnswer(choice.feedback, choice.label));
    setSimDone(true);
  }

  if (isHr) {
    return <HrDashboard />;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading
        eyebrow="Dashboard"
        title={`${session?.name ?? me?.name ?? "동료"}님, 오늘도 한 걸음`}
        description="온보딩 진행률과 오늘 일정, 다음에 할 일을 한눈에 보여드려요."
      />

      <Card className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-ink-faint">전체 진행률</p>
            <p className="mt-1 text-3xl font-bold text-ink">{stats.percent}%</p>
            <p className="mt-1 text-sm text-ink-soft">
              {stats.checked}/{stats.total} 항목 완료
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/journey/checklist">
              <SecondaryButton>30-60-90 체크리스트</SecondaryButton>
            </Link>
            <Link href="/intro/vision">
              <SecondaryButton>소개</SecondaryButton>
            </Link>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={stats.percent} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className="rounded-xl border border-line-soft bg-line-soft/50 px-3 py-2.5"
            >
              <p className="text-xs font-semibold text-brand">
                {CHECKLIST_STAGE_LABEL[stage]}
              </p>
              <p className="mt-1 text-lg font-bold text-ink">
                {stats.byStage[stage].checked}/{stats.byStage[stage].total}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <NewhireMissionWidget employeeId={currentEmployeeId} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <Eyebrow>Today · {DEMO_TODAY}</Eyebrow>
          <h3 className="mt-1 text-lg font-bold text-ink">오늘 일정</h3>
          {todayEvents.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">오늘 예정된 일정이 없어요.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {todayEvents.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-start justify-between gap-2 rounded-xl border border-line-soft px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{ev.title}</p>
                    <p className="text-xs text-ink-faint">{ev.description}</p>
                  </div>
                  <Tag tone="neutral">{ev.time ?? "종일"}</Tag>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <Eyebrow>Next up</Eyebrow>
          <h3 className="mt-1 text-lg font-bold text-ink">남은 체크리스트</h3>
          {unchecked.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">모든 항목을 완료했어요!</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {unchecked.map((item) => (
                <li key={item.id} className="flex items-center gap-2 text-sm text-ink">
                  <Tag tone="brand">{CHECKLIST_STAGE_LABEL[item.stage]}</Tag>
                  {item.title}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/journey/missions">
              <PrimaryButton>내 미션</PrimaryButton>
            </Link>
            <Link href="/journey/guide">
              <SecondaryButton>AI 업무 가이드</SecondaryButton>
            </Link>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <Eyebrow>오늘의 시나리오</Eyebrow>
          <h3 className="mt-1 text-lg font-bold text-ink">{scenario.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {scenario.context}
          </p>
          {attempt || simDone ? (
            <div className="mt-3 rounded-xl border border-brand/30 bg-brand-softer p-3.5 text-sm text-ink">
              {simFeedback || attempt?.aiFeedback}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {scenario.choices.map((c) => (
                <label
                  key={c.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 text-sm ${
                    choiceId === c.id
                      ? "border-brand bg-brand-softer"
                      : "border-line hover:border-brand/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="scenario"
                    checked={choiceId === c.id}
                    onChange={() => setChoiceId(c.id)}
                    className="mt-0.5 accent-[var(--color-brand)]"
                  />
                  {c.label}
                </label>
              ))}
              <PrimaryButton onClick={runScenario} disabled={!choiceId}>
                선택 제출
              </PrimaryButton>
            </div>
          )}
        </Card>

        <Card>
          <Eyebrow>자료실 추천</Eyebrow>
          <h3 className="mt-1 text-lg font-bold text-ink">바로 보면 좋은 문서</h3>
          <ul className="mt-3 space-y-2">
            {(docs.length > 0 ? docs : searchLibraryDocs("").slice(0, 2)).map(
              (doc) => (
                <li key={doc.id}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-xl border border-line-soft px-3 py-2.5 transition-colors hover:border-brand"
                  >
                    <Tag tone="neutral" className="mb-1">
                      {doc.category}
                    </Tag>
                    <p className="text-sm font-semibold text-ink">{doc.title}</p>
                    <p className="text-xs text-ink-soft">{doc.summary}</p>
                  </a>
                </li>
              )
            )}
          </ul>
          <Link
            href="/resources/tools"
            className="mt-3 inline-flex text-sm font-semibold text-brand-dark"
          >
            자료실 더 보기 →
          </Link>
        </Card>
      </div>

      {me && (
        <p className="mt-8 text-center text-xs text-ink-faint">
          {me.dept} · {me.phase} · {me.weekNumber}주차 · 리스크{" "}
          <RiskTag level={me.riskLevel} />
        </p>
      )}
    </div>
  );
}

function NewhireMissionWidget({ employeeId }: { employeeId: string }) {
  const { state } = useStore();
  const active = getActiveAssignmentForEmployee(state, employeeId);
  if (!active) return null;
  const pct = computeAssignmentProgressPct(state, active.id);
  return (
    <Card className="mb-6">
      <Eyebrow>이번 주 미션</Eyebrow>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-ink">
            {active.week}주차 · {active.title}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">{active.description}</p>
        </div>
        <p className="text-2xl font-bold text-ink">{pct}%</p>
      </div>
      <div className="mt-3">
        <ProgressBar value={pct} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/journey/missions">
          <PrimaryButton>미션 이어하기</PrimaryButton>
        </Link>
        <Link
          href={`/journey/guide?assignmentId=${encodeURIComponent(active.id)}&task=${encodeURIComponent(`${active.title} — ${active.description}`)}`}
        >
          <SecondaryButton>AI 가이드로 수행</SecondaryButton>
        </Link>
      </div>
    </Card>
  );
}

function HrDashboard() {
  const {
    state,
    currentEmployeeId,
    generateOKRDraft,
    approveOKR,
    rejectOKR,
    markMissionFeedbackReviewed,
    createReviewPacket,
    session,
  } = useStore();

  const pending = getHrMissionReviewQueue(state);
  const watchOrAlert = state.employees.filter((e) => e.riskLevel !== "stable");
  const meDraft = getDraftOkrForEmployee(state, currentEmployeeId);
  const [packetEmployeeId, setPacketEmployeeId] = useState(
    state.employees[0]?.id ?? currentEmployeeId
  );
  const packet = state.reviewPackets.find(
    (p) => p.employeeId === packetEmployeeId && p.period === "3개월"
  );

  const riskCards = useMemo(
    () =>
      state.employees.map((emp) => {
        const signals = getMissionRiskSignalsForEmployee(state, emp.id);
        return { emp, note: computeRiskNote(emp.id, 0, signals) };
      }),
    [state]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <SectionHeading
        eyebrow="HR Ops Dashboard"
        title={`${session?.name ?? "인사팀"}님, 코호트 운영 현황`}
        description="미션 AI 피드백 확인, OKR 초안, 리스크, 전환심사 브리핑을 대시보드에서 바로 처리하세요."
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-ink-faint">코호트 인원</p>
          <p className="mt-1 text-2xl font-bold">{state.employees.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-ink-faint">관찰·주의</p>
          <p className="mt-1 text-2xl font-bold">{watchOrAlert.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-ink-faint">확인 필요 미션</p>
          <p className="mt-1 text-2xl font-bold">{pending.length}</p>
        </Card>
        <Card>
          <p className="text-xs text-ink-faint">OKR 초안</p>
          <p className="mt-1 text-2xl font-bold">
            {state.okrCards.filter((c) => c.status === "draft").length}
          </p>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <Eyebrow>Mission Progress Copilot</Eyebrow>
          <h3 className="mt-1 font-bold text-ink">확인이 필요한 AI 피드백</h3>
          <ul className="mt-3 max-h-80 space-y-3 overflow-y-auto">
            {pending.length === 0 && (
              <li className="text-sm text-ink-soft">
                대기 중인 미션 피드백이 없어요.
              </li>
            )}
            {pending.slice(0, 5).map((item) => (
              <li key={item.feedbackId} className="rounded-xl border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink">
                    {item.employeeName} · {item.week}주차
                  </p>
                  <RiskTag level={item.forHr.riskLevel} />
                </div>
                <p className="mt-1 text-xs text-ink-faint">{item.missionTitle}</p>
                <p className="mt-1 text-xs text-ink-soft">{item.forHr.summary}</p>
                <p className="mt-1 text-xs font-medium text-brand-dark">
                  → {item.forHr.interventionHint}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <SecondaryButton
                    onClick={() =>
                      markMissionFeedbackReviewed(item.feedbackId)
                    }
                  >
                    확인 완료
                  </SecondaryButton>
                  <Link href="/feedback/review">
                    <SecondaryButton>상세 리뷰</SecondaryButton>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          <Link
            href="/journey/missions/manage"
            className="mt-3 inline-flex text-sm font-semibold text-brand-dark"
          >
            미션 배정하기 →
          </Link>
        </Card>

        <Card>
          <Eyebrow>OKR Draft Agent</Eyebrow>
          <h3 className="mt-1 font-bold text-ink">다음 달 목표 초안</h3>
          {!meDraft ? (
            <div className="mt-3">
              <PrimaryButton
                onClick={() => generateOKRDraft(currentEmployeeId, "2026-10")}
              >
                초안 생성
              </PrimaryButton>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {meDraft.objectives.map((o, i) => (
                <p key={i} className="text-sm text-ink-soft">
                  · {o.title}
                </p>
              ))}
              <div className="flex gap-2 pt-2">
                <PrimaryButton onClick={() => approveOKR(meDraft.id)}>
                  승인
                </PrimaryButton>
                <SecondaryButton onClick={() => rejectOKR(meDraft.id)}>
                  반려
                </SecondaryButton>
              </div>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <SectionHeading title="Isolation Risk Radar" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {riskCards.map(({ emp, note }) => (
            <Card key={emp.id}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{emp.name}</span>
                <RiskTag level={note.level} />
              </div>
              <p className="mt-2 text-xs text-ink-soft">{note.reason}</p>
              <p className="mt-1 text-xs font-medium text-brand-dark">
                → {note.suggestedAction}
              </p>
            </Card>
          ))}
        </div>
      </div>

      <Card className="mt-6">
        <Eyebrow>Review Packet</Eyebrow>
        <h3 className="mt-1 font-bold text-ink">3개월 전환심사 브리핑</h3>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <select
            value={packetEmployeeId}
            onChange={(e) => setPacketEmployeeId(e.target.value)}
            className="rounded-lg border border-line px-3 py-2 text-sm"
          >
            {state.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <PrimaryButton
            onClick={() => createReviewPacket(packetEmployeeId, "3개월")}
          >
            브리핑 생성
          </PrimaryButton>
        </div>
        {packet && (
          <div className="mt-4 space-y-2 rounded-xl bg-line-soft/60 p-4 text-sm">
            <p className="text-ink-soft">{packet.growthNote}</p>
            <p className="text-ink-soft">{packet.riskNote}</p>
            <p className="font-semibold text-brand-dark">{packet.recommendation}</p>
          </div>
        )}
        <Link
          href="/feedback/anonymous"
          className="mt-3 inline-flex text-sm font-semibold text-brand-dark"
        >
          익명 피드백 확인 →
        </Link>
      </Card>
    </div>
  );
}
