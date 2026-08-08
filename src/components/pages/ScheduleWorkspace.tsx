"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { CHECKLIST_STAGE_LABEL, DEMO_TODAY } from "@/lib/seed";
import {
  getCalendarEventsForMonth,
  getChecklistProgress,
  getChecklistStats,
  getEmployeeById,
  getOkrCardsForMonth,
} from "@/lib/selectors";
import {
  Card,
  Eyebrow,
  PrimaryButton,
  ProgressBar,
  SecondaryButton,
  SectionHeading,
  Tag,
} from "@/components/ui";
import { PageShell } from "@/components/SidePanel";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Toast } from "@/components/Toast";
import type {
  CalendarEvent,
  ChecklistItemDef,
  ChecklistStage,
  OKRCard,
  OKRObjective,
} from "@/lib/types";

const CALENDAR_YEAR = 2026;
const CALENDAR_MONTH = 7;
const OKR_MONTH = "2026-08";

const EVENT_TYPE_LABEL: Record<CalendarEvent["type"], string> = {
  education: "교육",
  meeting: "미팅",
  review: "리뷰",
  social: "모임",
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const SIDEBAR_STAGES: ChecklistStage[] = [
  "day1",
  "week1",
  "month1",
  "day60",
  "day90",
];

const STAGE_CARD_LABEL: Record<ChecklistStage, string> = {
  day1: "일간",
  week1: "주간",
  month1: "월간",
  day60: "60일",
  day90: "90일",
};

type FocusMode = "week" | "day";

function toDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDisplayDate(iso: string): string {
  const date = parseISO(iso);
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAY_LABELS[date.getDay()]})`;
}

function getWeekRange(iso: string): { start: Date; end: Date; dates: string[] } {
  const date = parseISO(iso);
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(toDateISO(d.getFullYear(), d.getMonth(), d.getDate()));
  }
  return { start, end, dates };
}

function formatWeekLabel(start: Date, end: Date): string {
  return `${start.getMonth() + 1}/${start.getDate()} – ${end.getMonth() + 1}/${end.getDate()}`;
}

export type SchedulePanel = "all" | "checklist" | "timeline" | "okr";

export default function ScheduleWorkspace({
  panel = "all",
}: {
  panel?: SchedulePanel;
}) {
  const {
    state,
    session,
    currentEmployeeId,
    checklistItems,
    toggleChecklistItem,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    restoreChecklistItem,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    restoreCalendarEvent,
    upsertOkrCard,
    deleteOkrCard,
    restoreOkrCard,
  } = useStore();

  const isHr = session?.role === "hr";
  const showOkr = panel === "all" || panel === "okr";
  const showTimeline = panel === "all" || panel === "timeline";
  const showChecklist = panel === "all" || panel === "checklist";
  const embedded = panel !== "all";
  const [selectedDay, setSelectedDay] = useState(DEMO_TODAY);
  const [focus, setFocus] = useState<FocusMode>("week");

  const [eventForm, setEventForm] = useState({
    id: "" as string,
    title: "",
    date: DEMO_TODAY,
    time: "",
    type: "meeting" as CalendarEvent["type"],
    description: "",
  });
  const [showEventForm, setShowEventForm] = useState(false);

  const [checkForm, setCheckForm] = useState({
    id: "",
    stage: "day1" as ChecklistStage,
    title: "",
    description: "",
  });
  const [showCheckForm, setShowCheckForm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<
    | null
    | { kind: "checklist"; id: string }
    | { kind: "okr"; id: string }
    | { kind: "event"; id: string }
  >(null);
  const [undoToast, setUndoToast] = useState<
    | null
    | { kind: "checklist"; item: ChecklistItemDef }
    | { kind: "okr"; card: OKRCard }
    | { kind: "event"; event: CalendarEvent }
  >(null);

  const [okrEditId, setOkrEditId] = useState<string | null>(null);
  const [okrEmployeeId, setOkrEmployeeId] = useState(currentEmployeeId);
  const [okrObjective, setOkrObjective] = useState("");
  const [okrKrs, setOkrKrs] = useState("KR1\nKR2");

  const monthEvents = useMemo(
    () => getCalendarEventsForMonth(state, CALENDAR_YEAR, CALENDAR_MONTH),
    [state]
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of monthEvents) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [monthEvents]);

  const progress = getChecklistProgress(state, currentEmployeeId);
  const stats = getChecklistStats(state, currentEmployeeId);
  const checkedSet = new Set(progress?.checkedIds ?? []);

  const daysInMonth = new Date(CALENDAR_YEAR, CALENDAR_MONTH + 1, 0).getDate();
  const firstWeekday = new Date(CALENDAR_YEAR, CALENDAR_MONTH, 1).getDay();
  const calendarCells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const week = useMemo(() => getWeekRange(selectedDay), [selectedDay]);
  const weekEvents = useMemo(
    () => week.dates.flatMap((iso) => eventsByDate.get(iso) ?? []),
    [week.dates, eventsByDate]
  );
  const dayEvents = eventsByDate.get(selectedDay) ?? [];
  const focusEvents = focus === "day" ? dayEvents : weekEvents;

  const monthOkrs = useMemo(() => {
    const all = getOkrCardsForMonth(state, OKR_MONTH);
    if (isHr) return all;
    return all.filter((c) => c.employeeId === currentEmployeeId);
  }, [state, isHr, currentEmployeeId]);

  function stagePercent(stage: ChecklistStage): number {
    const { total, checked } = stats.byStage[stage];
    return total === 0 ? 0 : Math.round((checked / total) * 100);
  }

  function openNewEvent(date = selectedDay) {
    setEventForm({
      id: "",
      title: "",
      date,
      time: "",
      type: "meeting",
      description: "",
    });
    setShowEventForm(true);
  }

  function openEditEvent(ev: CalendarEvent) {
    setEventForm({
      id: ev.id,
      title: ev.title,
      date: ev.date,
      time: ev.time ?? "",
      type: ev.type,
      description: ev.description ?? "",
    });
    setShowEventForm(true);
  }

  function saveEvent() {
    if (!eventForm.title.trim() || !eventForm.date) return;
    if (eventForm.id) {
      updateCalendarEvent({
        id: eventForm.id,
        title: eventForm.title,
        date: eventForm.date,
        time: eventForm.time || undefined,
        type: eventForm.type,
        description: eventForm.description || undefined,
      });
    } else {
      addCalendarEvent({
        title: eventForm.title,
        date: eventForm.date,
        time: eventForm.time || undefined,
        type: eventForm.type,
        description: eventForm.description || undefined,
      });
    }
    setShowEventForm(false);
  }

  function openNewCheck(stage: ChecklistStage) {
    setCheckForm({ id: "", stage, title: "", description: "" });
    setShowCheckForm(true);
  }

  function openEditCheck(item: ChecklistItemDef) {
    setCheckForm({
      id: item.id,
      stage: item.stage,
      title: item.title,
      description: item.description ?? "",
    });
    setShowCheckForm(true);
  }

  function saveCheck() {
    if (!checkForm.title.trim()) return;
    if (checkForm.id) {
      updateChecklistItem({
        id: checkForm.id,
        title: checkForm.title,
        description: checkForm.description || undefined,
        stage: checkForm.stage,
      });
    } else {
      addChecklistItem({
        stage: checkForm.stage,
        title: checkForm.title,
        description: checkForm.description || undefined,
      });
    }
    setShowCheckForm(false);
  }

  function openNewOkr() {
    setOkrEditId(null);
    setOkrEmployeeId(isHr ? state.employees[0]?.id ?? currentEmployeeId : currentEmployeeId);
    setOkrObjective("");
    setOkrKrs("KR1\nKR2");
  }

  function openEditOkr(card: OKRCard) {
    setOkrEditId(card.id);
    setOkrEmployeeId(card.employeeId);
    setOkrObjective(card.objectives[0]?.title ?? "");
    setOkrKrs(
      (card.objectives[0]?.keyResults ?? []).map((kr) => kr.text).join("\n") ||
        "KR1"
    );
  }

  function saveOkr() {
    if (!okrObjective.trim() || !isHr) return;
    const keyResults = okrKrs
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text, progress: 0 }));
    if (keyResults.length === 0) return;
    const objectives: OKRObjective[] = [
      { title: okrObjective.trim(), keyResults, dnaLinked: [] },
    ];
    upsertOkrCard({
      id: okrEditId ?? undefined,
      employeeId: okrEmployeeId,
      month: OKR_MONTH,
      objectives,
      status: "approved",
    });
    setOkrEditId(null);
    setOkrObjective("");
  }

  function renderChecklistList(stage: ChecklistStage) {
    const items = checklistItems.filter((item) => item.stage === stage);

    return (
      <>
        <ul className="space-y-1">
          {items.map((item) => {
            const checked = checkedSet.has(item.id);
            return (
              <li key={item.id} className="group relative">
                <label
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border px-2 py-1.5 text-sm transition-colors ${
                    checked
                      ? "border-stable/30 bg-stable-soft/40 text-ink-soft"
                      : "border-line bg-white text-ink hover:border-brand/40"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[var(--color-brand)]"
                  />
                  <div className="min-w-0 flex-1 pr-10">
                    <p
                      className={`text-[13px] font-semibold leading-snug ${
                        checked ? "line-through" : ""
                      }`}
                    >
                      {item.title}
                    </p>
                    {item.description && (
                      <p className="mt-0.5 text-[11px] leading-snug text-ink-faint">
                        {item.description}
                      </p>
                    )}
                  </div>
                </label>
                <div className="absolute right-1.5 top-1.5 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => openEditCheck(item)}
                    className="text-[10px] font-semibold text-brand-dark"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingDelete({ kind: "checklist", id: item.id })
                    }
                    className="min-h-11 px-1 text-[10px] font-semibold text-alert"
                  >
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => openNewCheck(stage)}
          className="mt-1.5 w-full rounded-lg border border-dashed border-line px-2 py-1 text-[11px] font-semibold text-ink-soft hover:border-brand hover:text-brand-dark"
        >
          + 항목 추가
        </button>
      </>
    );
  }

  const checklistGrid = (
    <div
      className={
        showTimeline && showChecklist
          ? "max-h-[calc(100vh-6rem)] space-y-2 overflow-y-auto pr-1"
          : "grid gap-2 sm:grid-cols-2 xl:grid-cols-3"
      }
    >
      {SIDEBAR_STAGES.map((stage) => {
        const stageStats = stats.byStage[stage];
        const percent = stagePercent(stage);
        return (
          <Card
            key={stage}
            className={`!p-3 ${
              stage === "month1" ? "border-brand/20 bg-brand-softer/40" : ""
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-brand">
                  {STAGE_CARD_LABEL[stage]}
                </p>
                <h3 className="truncate text-sm font-bold text-ink">
                  {CHECKLIST_STAGE_LABEL[stage]}
                </h3>
              </div>
              <p className="shrink-0 text-[11px] font-semibold text-ink-faint">
                {stageStats.checked}/{stageStats.total} · {percent}%
              </p>
            </div>
            <div className="mt-1.5">
              <ProgressBar value={percent} />
            </div>
            <div className="mt-2">{renderChecklistList(stage)}</div>
          </Card>
        );
      })}
    </div>
  );

  const okrBlock = showOkr ? (
      <Card className={embedded ? undefined : "mb-6"}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Eyebrow>Monthly OKR</Eyebrow>
            <h3 className="mt-1 text-lg font-bold text-ink">2026년 8월 OKR 목표</h3>
            <p className="mt-1 text-xs text-ink-soft">
              {isHr
                ? "인사팀 관리자 권한으로 OKR을 추가·수정할 수 있어요."
                : "이번 달 목표 카드입니다. 수정은 인사팀이 담당합니다."}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {monthOkrs.length === 0 ? (
            <p className="text-sm text-ink-soft">이번 달 OKR이 아직 없어요.</p>
          ) : (
            monthOkrs.map((card) => {
              const emp = getEmployeeById(state, card.employeeId);
              return (
                <div
                  key={card.id}
                  className="rounded-xl border border-line bg-white p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Tag tone="brand">{emp?.name ?? card.employeeId}</Tag>
                    <Tag tone={card.status === "approved" ? "stable" : "watch"}>
                      {card.status === "approved" ? "승인" : "초안"}
                    </Tag>
                  </div>
                  {card.objectives.map((obj, i) => (
                    <div key={i} className="mt-2">
                      <p className="text-sm font-bold text-ink">{obj.title}</p>
                      <ul className="mt-1.5 space-y-1">
                        {obj.keyResults.map((kr, j) => (
                          <li key={j} className="text-xs text-ink-soft">
                            · {kr.text}
                            <span className="ml-1 text-ink-faint">
                              ({kr.progress}%)
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  {isHr && (
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditOkr(card)}
                        className="text-xs font-semibold text-brand-dark"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingDelete({ kind: "okr", id: card.id })
                        }
                        className="min-h-11 px-1 text-xs font-semibold text-alert"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {isHr && (
          <HrOkrAddPanel
            employees={state.employees}
            employeeId={okrEmployeeId}
            setEmployeeId={setOkrEmployeeId}
            objective={okrObjective}
            setObjective={setOkrObjective}
            krs={okrKrs}
            setKrs={setOkrKrs}
            editingId={okrEditId}
            onSave={saveOkr}
            onCancel={() => {
              setOkrEditId(null);
              setOkrObjective("");
              setOkrKrs("KR1\nKR2");
            }}
            onStartAdd={openNewOkr}
          />
        )}
      </Card>
  ) : null;

  const calendarColumn = (
    <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <Eyebrow>2026년 8월</Eyebrow>
                <h3 className="mt-1 text-lg font-bold text-ink">온보딩 캘린더</h3>
              </div>
              <SecondaryButton onClick={() => openNewEvent()}>
                + 일정 추가
              </SecondaryButton>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-faint">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="py-1">
                  {label}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="aspect-square" />;
                }
                const iso = toDateISO(CALENDAR_YEAR, CALENDAR_MONTH, day);
                const dayEv = eventsByDate.get(iso) ?? [];
                const isToday = iso === DEMO_TODAY;
                const isSelected = iso === selectedDay;
                const inWeek = week.dates.includes(iso) && focus === "week";

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      setSelectedDay(iso);
                      setFocus("day");
                    }}
                    className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                      isToday
                        ? "bg-brand text-white ring-2 ring-brand ring-offset-1"
                        : isSelected && focus === "day"
                          ? "bg-brand-soft text-brand-dark ring-1 ring-brand/40"
                          : inWeek
                            ? "bg-line-soft text-ink"
                            : "text-ink hover:bg-line-soft"
                    }`}
                  >
                    {day}
                    {dayEv.length > 0 && (
                      <span className="mt-0.5 flex gap-0.5">
                        {dayEv.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className={`h-1 w-1 rounded-full ${
                              isToday ? "bg-white/90" : "bg-brand"
                            }`}
                          />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>

          {showEventForm && (
            <Card>
              <Eyebrow>{eventForm.id ? "일정 수정" : "일정 추가"}</Eyebrow>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  value={eventForm.title}
                  onChange={(e) =>
                    setEventForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="제목"
                  className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand sm:col-span-2"
                />
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) =>
                    setEventForm((f) => ({ ...f, date: e.target.value }))
                  }
                  className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <input
                  value={eventForm.time}
                  onChange={(e) =>
                    setEventForm((f) => ({ ...f, time: e.target.value }))
                  }
                  placeholder="시간 (예: 14:00)"
                  className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <select
                  value={eventForm.type}
                  onChange={(e) =>
                    setEventForm((f) => ({
                      ...f,
                      type: e.target.value as CalendarEvent["type"],
                    }))
                  }
                  className="rounded-xl border border-line px-3 py-2 text-sm"
                >
                  {Object.entries(EVENT_TYPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <input
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="설명 (선택)"
                  className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand sm:col-span-2"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <PrimaryButton
                  onClick={saveEvent}
                  disabled={!eventForm.title.trim()}
                >
                  저장
                </PrimaryButton>
                <SecondaryButton onClick={() => setShowEventForm(false)}>
                  취소
                </SecondaryButton>
              </div>
            </Card>
          )}

          {showCheckForm && (
            <Card>
              <Eyebrow>
                {checkForm.id ? "체크리스트 수정" : "체크리스트 추가"}
              </Eyebrow>
              <div className="mt-3 space-y-2">
                <select
                  value={checkForm.stage}
                  onChange={(e) =>
                    setCheckForm((f) => ({
                      ...f,
                      stage: e.target.value as ChecklistStage,
                    }))
                  }
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm"
                >
                  {SIDEBAR_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {CHECKLIST_STAGE_LABEL[s]}
                    </option>
                  ))}
                </select>
                <input
                  value={checkForm.title}
                  onChange={(e) =>
                    setCheckForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder="항목 제목"
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <input
                  value={checkForm.description}
                  onChange={(e) =>
                    setCheckForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="설명 (선택)"
                  className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <PrimaryButton
                  onClick={saveCheck}
                  disabled={!checkForm.title.trim()}
                >
                  저장
                </PrimaryButton>
                <SecondaryButton onClick={() => setShowCheckForm(false)}>
                  취소
                </SecondaryButton>
              </div>
            </Card>
          )}

          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Eyebrow>
                  {focus === "day" ? "일간 보기" : "주간 보기"}
                </Eyebrow>
                <h3 className="mt-1 text-lg font-bold text-ink">
                  {focus === "day"
                    ? formatDisplayDate(selectedDay)
                    : `${formatWeekLabel(week.start, week.end)} 주차`}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {focus === "day" ? (
                  <SecondaryButton onClick={() => setFocus("week")}>
                    이 주로 보기
                  </SecondaryButton>
                ) : (
                  <SecondaryButton onClick={() => setFocus("day")}>
                    선택일 보기
                  </SecondaryButton>
                )}
                <SecondaryButton onClick={() => openNewEvent(selectedDay)}>
                  + 일정
                </SecondaryButton>
              </div>
            </div>

            <div className="mt-5">
              {focusEvents.length === 0 ? (
                <p className="rounded-xl border border-dashed border-line px-3 py-4 text-sm text-ink-soft">
                  예정된 일정이 없어요.
                </p>
              ) : (
                <ul className="space-y-2">
                  {focusEvents.map((ev) => (
                    <li
                      key={ev.id}
                      className="rounded-xl border border-line-soft px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {focus === "week" && (
                            <p className="text-[11px] font-medium text-ink-faint">
                              {formatDisplayDate(ev.date)}
                            </p>
                          )}
                          <p className="text-sm font-semibold text-ink">
                            {ev.title}
                          </p>
                          {ev.description && (
                            <p className="mt-0.5 text-xs text-ink-faint">
                              {ev.description}
                            </p>
                          )}
                        </div>
                        <Tag tone="neutral">{ev.time ?? "종일"}</Tag>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Tag tone="brand">{EVENT_TYPE_LABEL[ev.type]}</Tag>
                        <button
                          type="button"
                          onClick={() => openEditEvent(ev)}
                          className="text-[11px] font-semibold text-brand-dark"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPendingDelete({ kind: "event", id: ev.id })
                          }
                          className="min-h-11 px-1 text-[11px] font-semibold text-alert"
                        >
                          삭제
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        </div>
  );

  return (
    <div
      className={
        embedded
          ? "space-y-6"
          : "mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14"
      }
    >
      {!embedded && (
        <SectionHeading
          eyebrow="일정"
          title="일정 & 체크리스트"
          description="일정을 추가·수정하고, 체크리스트를 자유롭게 관리하세요."
        />
      )}
      {okrBlock}
      {showTimeline && showChecklist && (
        <PageShell sidebar={checklistGrid}>{calendarColumn}</PageShell>
      )}
      {showTimeline && !showChecklist && (
        <div className="space-y-4">{calendarColumn}</div>
      )}
      {!showTimeline && showChecklist && checklistGrid}
      <ConfirmDialog
        open={pendingDelete !== null}
        title={
          pendingDelete?.kind === "checklist"
            ? "체크리스트 항목 삭제"
            : pendingDelete?.kind === "okr"
              ? "OKR 삭제"
              : "일정 삭제"
        }
        body={
          pendingDelete?.kind === "checklist"
            ? "이 체크리스트 항목을 삭제할까요? 삭제 직후 5초간 되돌릴 수 있어요."
            : pendingDelete?.kind === "okr"
              ? "이 OKR을 삭제할까요? 삭제 직후 5초간 되돌릴 수 있어요."
              : "이 일정을 삭제할까요? 삭제 직후 5초간 되돌릴 수 있어요."
        }
        confirmLabel="삭제"
        tone="danger"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.kind === "checklist") {
            const item = checklistItems.find((i) => i.id === pendingDelete.id);
            deleteChecklistItem(pendingDelete.id);
            if (item) setUndoToast({ kind: "checklist", item });
          } else if (pendingDelete.kind === "okr") {
            const card = state.okrCards.find((c) => c.id === pendingDelete.id);
            deleteOkrCard(pendingDelete.id);
            if (card) setUndoToast({ kind: "okr", card });
          } else {
            const event = state.calendarEvents.find(
              (e) => e.id === pendingDelete.id
            );
            deleteCalendarEvent(pendingDelete.id);
            if (event) setUndoToast({ kind: "event", event });
          }
          setPendingDelete(null);
        }}
      />
      <Toast
        open={undoToast !== null}
        message="삭제했어요."
        actionLabel="되돌리기"
        onClose={() => setUndoToast(null)}
        onAction={() => {
          if (!undoToast) return;
          if (undoToast.kind === "checklist") {
            restoreChecklistItem(undoToast.item);
          } else if (undoToast.kind === "okr") {
            restoreOkrCard(undoToast.card);
          } else {
            restoreCalendarEvent(undoToast.event);
          }
        }}
      />
    </div>
  );
}


function HrOkrAddPanel({
  employees,
  employeeId,
  setEmployeeId,
  objective,
  setObjective,
  krs,
  setKrs,
  editingId,
  onSave,
  onCancel,
  onStartAdd,
}: {
  employees: { id: string; name: string; dept: string }[];
  employeeId: string;
  setEmployeeId: (id: string) => void;
  objective: string;
  setObjective: (v: string) => void;
  krs: string;
  setKrs: (v: string) => void;
  editingId: string | null;
  onSave: () => void;
  onCancel: () => void;
  onStartAdd: () => void;
}) {
  const [open, setOpen] = useState(false);
  const showing = open || editingId !== null;

  return (
    <div className="mt-4">
      {!showing ? (
        <SecondaryButton
          onClick={() => {
            onStartAdd();
            setOpen(true);
          }}
        >
          + OKR 추가
        </SecondaryButton>
      ) : (
        <div className="rounded-xl border border-line bg-line-soft/40 p-4">
          <p className="text-xs font-semibold text-ink-faint">
            {editingId ? "OKR 수정 (관리자)" : "OKR 추가 (관리자)"}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="rounded-xl border border-line px-3 py-2 text-sm"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} · {e.dept}
                </option>
              ))}
            </select>
            <input
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="목표 (Objective)"
              className="rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <textarea
            value={krs}
            onChange={(e) => setKrs(e.target.value)}
            rows={3}
            placeholder="핵심 결과 (줄바꿈으로 구분)"
            className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="mt-2 flex gap-2">
            <PrimaryButton
              onClick={() => {
                onSave();
                setOpen(false);
              }}
              disabled={!objective.trim()}
            >
              저장
            </PrimaryButton>
            <SecondaryButton
              onClick={() => {
                onCancel();
                setOpen(false);
              }}
            >
              취소
            </SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
