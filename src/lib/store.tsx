"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type {
  AskQuestion,
  AuthSession,
  BoardCategory,
  BuddyThread,
  CalendarEvent,
  ChecklistItemDef,
  ChecklistProgress,
  ChecklistStage,
  CommunityChannel,
  CommunityPost,
  ContextChecklist,
  DNAEvidence,
  DNAId,
  DeptTeam,
  Employee,
  MissionAssignment,
  MissionAttachment,
  MissionCheckIn,
  MissionFeedback,
  OKRCard,
  OKRObjective,
  ReviewPacket,
  SimulatorAttempt,
} from "./types";
import {
  CHECKLIST_ITEMS,
  DEMO_EMPLOYEE_ID,
  MISSION_TEMPLATES,
  MISSIONS,
  SCENARIOS,
  SEED_CALENDAR_EVENTS,
  SEED_CHECKLIST_PROGRESS,
  SEED_COMMUNITY_POSTS,
  SEED_DNA_EVIDENCE,
  SEED_EMPLOYEES,
  SEED_MISSION_ASSIGNMENTS,
  SEED_MISSION_CHECKINS,
  SEED_MISSION_FEEDBACKS,
  SEED_OKR_CARDS,
} from "./seed";
import {
  analyzeTaskContext,
  computeRiskNote,
  draftOKRFromEvidence,
  evaluateSimulatorAnswer,
  generateMissionFeedback,
  generateReviewPacket,
  matchFAQ,
} from "./ai";
import { getMissionRiskSignalsForEmployee } from "./selectors";

interface State {
  session: AuthSession | null;
  employees: Employee[];
  evidence: DNAEvidence[];
  simulatorAttempts: SimulatorAttempt[];
  okrCards: OKRCard[];
  askQuestions: AskQuestion[];
  reviewPackets: ReviewPacket[];
  contextChecklists: ContextChecklist[];
  checklistItems: ChecklistItemDef[];
  checklistProgress: ChecklistProgress[];
  calendarEvents: CalendarEvent[];
  communityPosts: CommunityPost[];
  buddyThreads: BuddyThread[];
  missionAssignments: MissionAssignment[];
  missionCheckIns: MissionCheckIn[];
  missionFeedbacks: MissionFeedback[];
}

function seedState(): State {
  return {
    session: null,
    employees: SEED_EMPLOYEES.map((e) => ({ ...e })),
    evidence: SEED_DNA_EVIDENCE.map((e) => ({ ...e })),
    simulatorAttempts: [],
    okrCards: SEED_OKR_CARDS.map((c) => ({
      ...c,
      objectives: c.objectives.map((o) => ({
        ...o,
        keyResults: o.keyResults.map((kr) => ({ ...kr })),
        dnaLinked: [...o.dnaLinked],
      })),
    })),
    askQuestions: [],
    reviewPackets: [],
    contextChecklists: [],
    checklistItems: CHECKLIST_ITEMS.map((i) => ({ ...i })),
    checklistProgress: SEED_CHECKLIST_PROGRESS.map((p) => ({
      ...p,
      checkedIds: [...p.checkedIds],
    })),
    calendarEvents: SEED_CALENDAR_EVENTS.map((e) => ({ ...e })),
    communityPosts: SEED_COMMUNITY_POSTS.map((p) => ({ ...p })),
    buddyThreads: [],
    missionAssignments: SEED_MISSION_ASSIGNMENTS.map((a) => ({
      ...a,
      dnaFocus: [...a.dnaFocus],
    })),
    missionCheckIns: SEED_MISSION_CHECKINS.map((c) => ({
      ...c,
      guideSessionIds: [...c.guideSessionIds],
      attachments: c.attachments?.map((att) => ({ ...att })),
    })),
    missionFeedbacks: SEED_MISSION_FEEDBACKS.map((f) => ({
      ...f,
      forNewhire: {
        ...f.forNewhire,
        nextActions: [...f.forNewhire.nextActions],
      },
      forHr: { ...f.forHr },
    })),
  };
}

type Action =
  | { type: "HYDRATE"; payload: State }
  | { type: "LOGIN"; session: AuthSession }
  | { type: "LOGOUT" }
    | {
      type: "SUBMIT_SIMULATOR";
      scenarioId: string;
      choiceId: string;
      reasoning: string;
    }
  | { type: "RUN_CONTEXT_CHECKLIST"; week: number; taskText: string; assignmentId?: string }
  | { type: "PRACTICE_GUIDE"; checklistId: string; guideId: string }
  | { type: "GENERATE_OKR_DRAFT"; employeeId: string; month: string }
  | { type: "APPROVE_OKR"; id: string }
  | { type: "REJECT_OKR"; id: string }
  | { type: "SUBMIT_ASK"; text: string }
  | {
      type: "ASSIGN_MISSION";
      employeeId: string;
      templateId?: string;
      week: number;
      title: string;
      description: string;
      dnaFocus: DNAId[];
      dueAt: string;
      priority?: "normal" | "high";
    }
  | {
      type: "UPDATE_MISSION_ASSIGNMENT";
      id: string;
      title: string;
      description: string;
      dnaFocus: DNAId[];
      dueAt: string;
      priority: "normal" | "high";
    }
  | {
      type: "SUBMIT_MISSION_CHECKIN";
      assignmentId: string;
      privateNote?: string;
      artifactNote?: string;
      attachments?: MissionAttachment[];
      /** When true, generate AI feedback immediately after saving the check-in. */
      generateFeedback?: boolean;
    }
  | { type: "GENERATE_MISSION_FEEDBACK"; assignmentId: string }
  | {
      type: "MARK_MISSION_FEEDBACK_REVIEWED";
      id: string;
      hrInternalNote?: string;
      /** Weekly note delivered to the newhire (미션 피드백 inbox). */
      hrWeeklyFeedback?: string;
    }
  | { type: "CREATE_REVIEW_PACKET"; employeeId: string; period: "3개월" | "6개월" }
  | { type: "RESET" }
  | { type: "TOGGLE_CHECKLIST_ITEM"; itemId: string }
  | {
      type: "ADD_CHECKLIST_ITEM";
      stage: ChecklistStage;
      title: string;
      description?: string;
    }
  | {
      type: "UPDATE_CHECKLIST_ITEM";
      id: string;
      title: string;
      description?: string;
      stage: ChecklistStage;
    }
  | { type: "DELETE_CHECKLIST_ITEM"; id: string }
  | { type: "RESTORE_CHECKLIST_ITEM"; item: ChecklistItemDef }
  | {
      type: "ADD_CALENDAR_EVENT";
      title: string;
      date: string;
      time?: string;
      eventType: CalendarEvent["type"];
      description?: string;
    }
  | {
      type: "UPDATE_CALENDAR_EVENT";
      id: string;
      title: string;
      date: string;
      time?: string;
      eventType: CalendarEvent["type"];
      description?: string;
    }
  | { type: "DELETE_CALENDAR_EVENT"; id: string }
  | { type: "RESTORE_CALENDAR_EVENT"; event: CalendarEvent }
  | {
      type: "UPSERT_OKR_CARD";
      id?: string;
      employeeId: string;
      month: string;
      objectives: OKRObjective[];
      status?: OKRCard["status"];
    }
  | { type: "DELETE_OKR_CARD"; id: string }
  | { type: "RESTORE_OKR_CARD"; card: OKRCard }
  | {
      type: "ADD_COMMUNITY_POST";
      channel: CommunityChannel;
      body: string;
      title?: string;
      anonymous?: boolean;
      team?: DeptTeam;
      boardCategory?: BoardCategory;
      peerEmployeeId?: string;
    }
  | { type: "CREATE_BUDDY_THREAD"; id: string }
  | { type: "RENAME_BUDDY_THREAD"; threadId: string; title: string }
  | { type: "APPEND_BUDDY_USER_MESSAGE"; threadId: string; content: string }
  | { type: "APPEND_BUDDY_ASSISTANT_MESSAGE"; threadId: string; content: string }
  | { type: "DELETE_BUDDY_THREAD"; threadId: string }
  | { type: "RESTORE_BUDDY_THREAD"; thread: BuddyThread };

function actorEmployeeId(state: State): string | null {
  return state.session?.employeeId ?? null;
}

function recomputeRisk(state: State, employeeId: string): Employee[] {
  const signals = getMissionRiskSignalsForEmployee(state, employeeId);
  const note = computeRiskNote(employeeId, 0, signals);
  return state.employees.map((e) =>
    e.id === employeeId ? { ...e, riskLevel: note.level } : e
  );
}

function withMissionFeedback(state: State, assignmentId: string): State {
  const assignment = state.missionAssignments.find((a) => a.id === assignmentId);
  if (!assignment) return state;
  const checkIns = state.missionCheckIns.filter(
    (c) => c.assignmentId === assignmentId
  );
  const guides = state.contextChecklists.filter(
    (c) => c.assignmentId === assignmentId
  );
  const result = generateMissionFeedback(assignment, checkIns, guides);
  const feedback: MissionFeedback = {
    id: `fb-${assignmentId}-${Date.now()}`,
    assignmentId: assignment.id,
    employeeId: assignment.employeeId,
    week: assignment.week,
    missionTitle: assignment.title,
    forNewhire: result.forNewhire,
    forHr: result.forHr,
    generatedAt: new Date().toISOString(),
    hrReviewed: result.forHr.riskLevel === "stable",
  };
  const newEvidence: DNAEvidence[] = result.dnaTags.map((dnaId) => ({
    id: `ev-mission-${assignment.id}-${dnaId}-${Date.now()}`,
    employeeId: assignment.employeeId,
    dnaId,
    source: "mission" as const,
    sourceLabel: `${assignment.week}주차 미션`,
    snippet: `${assignment.title} · 진행 ${result.forHr.progressPct}%`,
    week: assignment.week,
    createdAt: new Date().toISOString(),
  }));
  const missionAssignments = state.missionAssignments.map((a) =>
    a.id === assignment.id
      ? {
          ...a,
          status:
            result.forHr.riskLevel === "stable"
              ? ("completed" as const)
              : ("awaiting_review" as const),
        }
      : a
  );
  const nextState: State = {
    ...state,
    missionFeedbacks: [
      ...state.missionFeedbacks.filter((f) => f.assignmentId !== assignment.id),
      feedback,
    ],
    missionAssignments,
    evidence: [...state.evidence, ...newEvidence],
  };
  nextState.employees = recomputeRisk(nextState, assignment.employeeId);
  return nextState;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE": {
      const seed = seedState();
      return {
        ...seed,
        ...action.payload,
        session: action.payload.session ?? null,
        checklistItems:
          action.payload.checklistItems &&
          action.payload.checklistItems.length > 0
            ? action.payload.checklistItems
            : CHECKLIST_ITEMS.map((i) => ({ ...i })),
        missionAssignments:
          action.payload.missionAssignments ?? seed.missionAssignments,
        missionCheckIns:
          action.payload.missionCheckIns ?? seed.missionCheckIns,
        missionFeedbacks:
          action.payload.missionFeedbacks ?? seed.missionFeedbacks,
        contextChecklists: action.payload.contextChecklists ?? [],
      };
    }

    case "LOGIN": {
      let employees = state.employees;
      if (action.session.role === "newhire" && action.session.team) {
        employees = employees.map((e) =>
          e.id === action.session.employeeId
            ? { ...e, name: action.session.name, dept: action.session.team! }
            : e
        );
      }
      return { ...state, session: action.session, employees };
    }

    case "LOGOUT":
      return { ...state, session: null };

    case "SUBMIT_SIMULATOR": {
      const employeeId = actorEmployeeId(state);
      if (!employeeId) return state;
      const scenario = SCENARIOS.find((s) => s.id === action.scenarioId);
      const choice = scenario?.choices.find((c) => c.id === action.choiceId);
      if (!scenario || !choice) return state;

      const aiFeedback = evaluateSimulatorAnswer(
        choice.feedback,
        action.reasoning
      );

      const attempt: SimulatorAttempt = {
        id: `att-${scenario.id}-${Date.now()}`,
        employeeId,
        scenarioId: scenario.id,
        choiceId: choice.id,
        dnaId: choice.dnaId,
        reasoning: action.reasoning,
        aiFeedback,
        createdAt: new Date().toISOString(),
      };

      const evidence: DNAEvidence = {
        id: `ev-sim-${scenario.id}-${Date.now()}`,
        employeeId,
        dnaId: choice.dnaId,
        source: "simulator",
        sourceLabel: `Decision Simulator · ${scenario.title}`,
        snippet: action.reasoning.trim().slice(0, 80) || choice.label,
        week: scenario.week,
        createdAt: new Date().toISOString(),
      };

      return {
        ...state,
        simulatorAttempts: [
          ...state.simulatorAttempts.filter(
            (a) => !(a.employeeId === employeeId && a.scenarioId === scenario.id)
          ),
          attempt,
        ],
        evidence: [...state.evidence, evidence],
      };
    }

    case "RUN_CONTEXT_CHECKLIST": {
      const employeeId = actorEmployeeId(state);
      if (!employeeId) return state;
      const assignment = action.assignmentId
        ? state.missionAssignments.find((a) => a.id === action.assignmentId)
        : undefined;
      const template = MISSIONS.find((m) => m.week === action.week);
      const fallbackDna = assignment?.dnaFocus ?? template?.dnaFocus ?? [];
      const result = analyzeTaskContext(action.taskText, fallbackDna);
      const checklist: ContextChecklist = {
        id: `checklist-${employeeId}-${Date.now()}`,
        employeeId,
        week: action.week,
        taskText: action.taskText,
        relevantDnaIds: result.relevantDnaIds,
        matchedKeywords: result.matchedKeywords,
        rationale: result.rationale,
        guides: result.guides,
        practicedGuideIds: [],
        assignmentId: action.assignmentId,
        createdAt: new Date().toISOString(),
      };
      let missionAssignments = state.missionAssignments;
      if (assignment && assignment.status === "assigned") {
        missionAssignments = missionAssignments.map((a) =>
          a.id === assignment.id ? { ...a, status: "in_progress" as const } : a
        );
      }
      return {
        ...state,
        contextChecklists: [...state.contextChecklists, checklist],
        missionAssignments,
      };
    }

    case "PRACTICE_GUIDE": {
      const employeeId = actorEmployeeId(state);
      if (!employeeId) return state;
      const checklist = state.contextChecklists.find(
        (c) => c.id === action.checklistId
      );
      if (!checklist) return state;
      const guide = checklist.guides.find((g) => g.id === action.guideId);
      if (!guide) return state;

      const alreadyDone = checklist.practicedGuideIds.includes(action.guideId);

      if (alreadyDone) {
        return {
          ...state,
          contextChecklists: state.contextChecklists.map((c) =>
            c.id === checklist.id
              ? {
                  ...c,
                  practicedGuideIds: c.practicedGuideIds.filter(
                    (id) => id !== action.guideId
                  ),
                }
              : c
          ),
          evidence: state.evidence.filter(
            (e) => !e.id.startsWith(`ev-checklist-${action.guideId}-`)
          ),
        };
      }

      const evidence: DNAEvidence = {
        id: `ev-checklist-${action.guideId}-${Date.now()}`,
        employeeId,
        dnaId: guide.dnaId,
        source: "checklist",
        sourceLabel: "AI 가치 체크리스트",
        snippet: guide.text,
        week: checklist.week,
        createdAt: new Date().toISOString(),
      };

      return {
        ...state,
        contextChecklists: state.contextChecklists.map((c) =>
          c.id === checklist.id
            ? {
                ...c,
                practicedGuideIds: [...c.practicedGuideIds, action.guideId],
              }
            : c
        ),
        evidence: [...state.evidence, evidence],
      };
    }

    case "GENERATE_OKR_DRAFT": {
      const relevantEvidence = state.evidence.filter(
        (e) => e.employeeId === action.employeeId
      );
      const draft = draftOKRFromEvidence(
        relevantEvidence,
        action.employeeId,
        action.month
      );
      return {
        ...state,
        okrCards: [
          ...state.okrCards.filter(
            (c) =>
              !(
                c.employeeId === action.employeeId &&
                c.month === action.month &&
                c.status === "draft"
              )
          ),
          draft,
        ],
      };
    }

    case "APPROVE_OKR":
      return {
        ...state,
        okrCards: state.okrCards.map((c) =>
          c.id === action.id ? { ...c, status: "approved" } : c
        ),
      };

    case "REJECT_OKR":
      return {
        ...state,
        okrCards: state.okrCards.filter((c) => c.id !== action.id),
      };

    case "SUBMIT_ASK": {
      const result = matchFAQ(action.text);
      const question: AskQuestion = {
        id: `ask-${Date.now()}`,
        text: action.text,
        answer: result.answer,
        matched: result.matched,
        escalated: !result.matched,
        createdAt: new Date().toISOString(),
      };
      return { ...state, askQuestions: [...state.askQuestions, question] };
    }

    case "ASSIGN_MISSION": {
      const assignment: MissionAssignment = {
        id: `asg-${action.employeeId}-w${action.week}-${Date.now()}`,
        employeeId: action.employeeId,
        templateId: action.templateId,
        week: action.week,
        title: action.title,
        description: action.description,
        dnaFocus: [...action.dnaFocus],
        dueAt: action.dueAt,
        status: "assigned",
        assignedAt: new Date().toISOString(),
        assignedBy: "hr",
        priority: action.priority ?? "normal",
      };
      return {
        ...state,
        missionAssignments: [...state.missionAssignments, assignment],
      };
    }

    case "UPDATE_MISSION_ASSIGNMENT":
      return {
        ...state,
        missionAssignments: state.missionAssignments.map((a) =>
          a.id === action.id
            ? {
                ...a,
                title: action.title,
                description: action.description,
                dnaFocus: [...action.dnaFocus],
                dueAt: action.dueAt,
                priority: action.priority,
              }
            : a
        ),
      };

    case "SUBMIT_MISSION_CHECKIN": {
      const employeeId = actorEmployeeId(state);
      if (!employeeId) return state;
      const assignment = state.missionAssignments.find(
        (a) => a.id === action.assignmentId
      );
      if (!assignment || assignment.employeeId !== employeeId) return state;
      const guideSessionIds = state.contextChecklists
        .filter((c) => c.assignmentId === action.assignmentId)
        .map((c) => c.id);
      const checkIn: MissionCheckIn = {
        id: `chk-${action.assignmentId}-${Date.now()}`,
        assignmentId: action.assignmentId,
        employeeId,
        privateNote: action.privateNote?.trim() || undefined,
        artifactNote: action.artifactNote?.trim() || undefined,
        attachments:
          action.attachments && action.attachments.length > 0
            ? action.attachments.map((a) => ({ ...a }))
            : undefined,
        guideSessionIds,
        createdAt: new Date().toISOString(),
      };
      const missionAssignments = state.missionAssignments.map((a) =>
        a.id === action.assignmentId && a.status === "assigned"
          ? { ...a, status: "in_progress" as const }
          : a
      );
      const withCheckIn: State = {
        ...state,
        missionCheckIns: [...state.missionCheckIns, checkIn],
        missionAssignments,
      };
      if (action.generateFeedback) {
        return withMissionFeedback(withCheckIn, action.assignmentId);
      }
      return withCheckIn;
    }

    case "GENERATE_MISSION_FEEDBACK": {
      const employeeId = actorEmployeeId(state);
      const assignment = state.missionAssignments.find(
        (a) => a.id === action.assignmentId
      );
      if (!assignment) return state;
      // Allow self or HR to trigger generation for demo
      if (
        employeeId &&
        state.session?.role === "newhire" &&
        assignment.employeeId !== employeeId
      ) {
        return state;
      }
      return withMissionFeedback(state, action.assignmentId);
    }

    case "MARK_MISSION_FEEDBACK_REVIEWED": {
      const feedback = state.missionFeedbacks.find((f) => f.id === action.id);
      if (!feedback) return state;
      const weekly = action.hrWeeklyFeedback?.trim();
      const missionFeedbacks = state.missionFeedbacks.map((f) =>
        f.id === action.id
          ? {
              ...f,
              hrReviewed: true,
              hrInternalNote: action.hrInternalNote?.trim() || f.hrInternalNote,
              hrWeeklyFeedback: weekly || f.hrWeeklyFeedback,
              hrDeliveredAt: weekly
                ? new Date().toISOString()
                : f.hrDeliveredAt,
            }
          : f
      );
      const missionAssignments = state.missionAssignments.map((a) =>
        a.id === feedback.assignmentId
          ? { ...a, status: "completed" as const }
          : a
      );
      const nextState: State = {
        ...state,
        missionFeedbacks,
        missionAssignments,
      };
      nextState.employees = recomputeRisk(nextState, feedback.employeeId);
      return nextState;
    }

    case "CREATE_REVIEW_PACKET": {
      const employee = state.employees.find((e) => e.id === action.employeeId);
      if (!employee) return state;
      const evidence = state.evidence.filter(
        (e) => e.employeeId === action.employeeId
      );
      const okrHistory = state.okrCards.filter(
        (c) => c.employeeId === action.employeeId && c.status === "approved"
      );
      const packet = generateReviewPacket(
        employee,
        evidence,
        okrHistory,
        action.period
      );
      return {
        ...state,
        reviewPackets: [
          ...state.reviewPackets.filter(
            (p) => !(p.employeeId === action.employeeId && p.period === action.period)
          ),
          packet,
        ],
      };
    }

    case "RESET":
      return { ...seedState(), session: state.session };

    case "TOGGLE_CHECKLIST_ITEM": {
      const employeeId = actorEmployeeId(state);
      if (!employeeId) return state;
      const existing = state.checklistProgress.find(
        (p) => p.employeeId === employeeId
      );
      const now = new Date().toISOString();
      if (!existing) {
        return {
          ...state,
          checklistProgress: [
            ...state.checklistProgress,
            {
              employeeId,
              checkedIds: [action.itemId],
              updatedAt: now,
            },
          ],
        };
      }
      const hasItem = existing.checkedIds.includes(action.itemId);
      const checkedIds = hasItem
        ? existing.checkedIds.filter((id) => id !== action.itemId)
        : [...existing.checkedIds, action.itemId];
      return {
        ...state,
        checklistProgress: state.checklistProgress.map((p) =>
          p.employeeId === employeeId ? { ...p, checkedIds, updatedAt: now } : p
        ),
      };
    }

    case "ADD_CHECKLIST_ITEM": {
      const item: ChecklistItemDef = {
        id: `check-${Date.now()}`,
        stage: action.stage,
        title: action.title.trim(),
        description: action.description?.trim() || undefined,
      };
      if (!item.title) return state;
      return {
        ...state,
        checklistItems: [...state.checklistItems, item],
      };
    }

    case "UPDATE_CHECKLIST_ITEM": {
      const title = action.title.trim();
      if (!title) return state;
      return {
        ...state,
        checklistItems: state.checklistItems.map((item) =>
          item.id === action.id
            ? {
                ...item,
                title,
                description: action.description?.trim() || undefined,
                stage: action.stage,
              }
            : item
        ),
      };
    }

    case "DELETE_CHECKLIST_ITEM":
      return {
        ...state,
        checklistItems: state.checklistItems.filter((i) => i.id !== action.id),
        checklistProgress: state.checklistProgress.map((p) => ({
          ...p,
          checkedIds: p.checkedIds.filter((id) => id !== action.id),
        })),
      };

    case "RESTORE_CHECKLIST_ITEM":
      if (state.checklistItems.some((i) => i.id === action.item.id)) return state;
      return {
        ...state,
        checklistItems: [...state.checklistItems, action.item],
      };

    case "ADD_CALENDAR_EVENT": {
      const title = action.title.trim();
      if (!title || !action.date) return state;
      const event: CalendarEvent = {
        id: `evt-${Date.now()}`,
        title,
        date: action.date,
        time: action.time?.trim() || undefined,
        type: action.eventType,
        description: action.description?.trim() || undefined,
        employeeId: actorEmployeeId(state) ?? undefined,
      };
      return {
        ...state,
        calendarEvents: [...state.calendarEvents, event],
      };
    }

    case "UPDATE_CALENDAR_EVENT": {
      const title = action.title.trim();
      if (!title || !action.date) return state;
      return {
        ...state,
        calendarEvents: state.calendarEvents.map((ev) =>
          ev.id === action.id
            ? {
                ...ev,
                title,
                date: action.date,
                time: action.time?.trim() || undefined,
                type: action.eventType,
                description: action.description?.trim() || undefined,
              }
            : ev
        ),
      };
    }

    case "DELETE_CALENDAR_EVENT":
      return {
        ...state,
        calendarEvents: state.calendarEvents.filter((e) => e.id !== action.id),
      };

    case "RESTORE_CALENDAR_EVENT":
      if (state.calendarEvents.some((e) => e.id === action.event.id)) return state;
      return {
        ...state,
        calendarEvents: [...state.calendarEvents, action.event],
      };

    case "UPSERT_OKR_CARD": {
      const now = new Date().toISOString();
      if (action.id) {
        return {
          ...state,
          okrCards: state.okrCards.map((c) =>
            c.id === action.id
              ? {
                  ...c,
                  employeeId: action.employeeId,
                  month: action.month,
                  objectives: action.objectives,
                  status: action.status ?? c.status,
                  source: "manual",
                  generatedAt: now,
                }
              : c
          ),
        };
      }
      const card: OKRCard = {
        id: `okr-${Date.now()}`,
        employeeId: action.employeeId,
        month: action.month,
        objectives: action.objectives,
        status: action.status ?? "approved",
        source: "manual",
        generatedAt: now,
      };
      return { ...state, okrCards: [...state.okrCards, card] };
    }

    case "DELETE_OKR_CARD":
      return {
        ...state,
        okrCards: state.okrCards.filter((c) => c.id !== action.id),
      };

    case "RESTORE_OKR_CARD":
      if (state.okrCards.some((c) => c.id === action.card.id)) return state;
      return {
        ...state,
        okrCards: [...state.okrCards, action.card],
      };

    case "ADD_COMMUNITY_POST": {
      const session = state.session;
      if (!session) return state;
      const resolvedTeam =
        action.channel === "team"
          ? session.role === "newhire" && session.team
            ? session.team
            : action.team
          : action.team;
      if (action.channel === "team" && !resolvedTeam) return state;
      const post: CommunityPost = {
        id: `post-${Date.now()}`,
        channel: action.channel,
        authorId: session.role === "hr" ? "hr" : session.employeeId,
        authorName: action.anonymous ? "익명" : session.name,
        team: resolvedTeam,
        boardCategory:
          action.channel === "board"
            ? (action.boardCategory ?? "notice")
            : undefined,
        peerEmployeeId: action.peerEmployeeId,
        title: action.title,
        body: action.body,
        anonymous: action.anonymous ?? false,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        communityPosts: [...state.communityPosts, post],
      };
    }

    case "CREATE_BUDDY_THREAD": {
      const employeeId = actorEmployeeId(state);
      if (!employeeId) return state;
      const now = new Date().toISOString();
      const thread: BuddyThread = {
        id: action.id,
        employeeId,
        title: "새 대화",
        messages: [],
        createdAt: now,
        updatedAt: now,
      };
      return {
        ...state,
        buddyThreads: [...state.buddyThreads, thread],
      };
    }

    case "RENAME_BUDDY_THREAD":
      return {
        ...state,
        buddyThreads: state.buddyThreads.map((t) =>
          t.id === action.threadId
            ? { ...t, title: action.title, updatedAt: new Date().toISOString() }
            : t
        ),
      };

    case "APPEND_BUDDY_USER_MESSAGE": {
      const now = new Date().toISOString();
      return {
        ...state,
        buddyThreads: state.buddyThreads.map((t) => {
          if (t.id !== action.threadId) return t;
          const title =
            t.title === "새 대화"
              ? action.content.slice(0, 24) || t.title
              : t.title;
          return {
            ...t,
            title,
            updatedAt: now,
            messages: [
              ...t.messages,
              {
                id: `msg-${Date.now()}-user`,
                role: "user" as const,
                content: action.content,
                createdAt: now,
              },
            ],
          };
        }),
      };
    }

    case "APPEND_BUDDY_ASSISTANT_MESSAGE": {
      const now = new Date().toISOString();
      return {
        ...state,
        buddyThreads: state.buddyThreads.map((t) =>
          t.id === action.threadId
            ? {
                ...t,
                updatedAt: now,
                messages: [
                  ...t.messages,
                  {
                    id: `msg-${Date.now()}-assistant`,
                    role: "assistant" as const,
                    content: action.content,
                    createdAt: now,
                  },
                ],
              }
            : t
        ),
      };
    }

    case "DELETE_BUDDY_THREAD":
      return {
        ...state,
        buddyThreads: state.buddyThreads.filter((t) => t.id !== action.threadId),
      };

    case "RESTORE_BUDDY_THREAD":
      if (state.buddyThreads.some((t) => t.id === action.thread.id)) return state;
      return {
        ...state,
        buddyThreads: [...state.buddyThreads, action.thread],
      };

    default:
      return state;
  }
}

interface StoreValue {
  state: State;
  hydrated: boolean;
  session: AuthSession | null;
  missions: typeof MISSIONS;
  missionTemplates: typeof MISSION_TEMPLATES;
  scenarios: typeof SCENARIOS;
  checklistItems: ChecklistItemDef[];
  currentEmployeeId: string;
  login: (session: AuthSession) => void;
  logout: () => void;
  submitSimulatorAnswer: (
    scenarioId: string,
    choiceId: string,
    reasoning: string
  ) => void;
  runContextChecklist: (
    week: number,
    taskText: string,
    assignmentId?: string
  ) => void;
  practiceGuide: (checklistId: string, guideId: string) => void;
  generateOKRDraft: (employeeId: string, month: string) => void;
  approveOKR: (id: string) => void;
  rejectOKR: (id: string) => void;
  upsertOkrCard: (payload: {
    id?: string;
    employeeId: string;
    month: string;
    objectives: OKRObjective[];
    status?: OKRCard["status"];
  }) => void;
  deleteOkrCard: (id: string) => void;
  restoreOkrCard: (card: OKRCard) => void;
  submitAskQuestion: (text: string) => void;
  assignMission: (payload: {
    employeeId: string;
    templateId?: string;
    week: number;
    title: string;
    description: string;
    dnaFocus: DNAId[];
    dueAt: string;
    priority?: "normal" | "high";
  }) => void;
  updateMissionAssignment: (payload: {
    id: string;
    title: string;
    description: string;
    dnaFocus: DNAId[];
    dueAt: string;
    priority: "normal" | "high";
  }) => void;
  submitMissionCheckIn: (payload: {
    assignmentId: string;
    privateNote?: string;
    artifactNote?: string;
    attachments?: MissionAttachment[];
    generateFeedback?: boolean;
  }) => void;
  generateMissionFeedbackFor: (assignmentId: string) => void;
  markMissionFeedbackReviewed: (
    id: string,
    hrInternalNote?: string,
    hrWeeklyFeedback?: string
  ) => void;
  createReviewPacket: (employeeId: string, period: "3개월" | "6개월") => void;
  resetDemo: () => void;
  toggleChecklistItem: (itemId: string) => void;
  addChecklistItem: (payload: {
    stage: ChecklistStage;
    title: string;
    description?: string;
  }) => void;
  updateChecklistItem: (payload: {
    id: string;
    title: string;
    description?: string;
    stage: ChecklistStage;
  }) => void;
  deleteChecklistItem: (id: string) => void;
  restoreChecklistItem: (item: ChecklistItemDef) => void;
  addCalendarEvent: (payload: {
    title: string;
    date: string;
    time?: string;
    type: CalendarEvent["type"];
    description?: string;
  }) => void;
  updateCalendarEvent: (payload: {
    id: string;
    title: string;
    date: string;
    time?: string;
    type: CalendarEvent["type"];
    description?: string;
  }) => void;
  deleteCalendarEvent: (id: string) => void;
  restoreCalendarEvent: (event: CalendarEvent) => void;
  addCommunityPost: (payload: {
    channel: CommunityChannel;
    body: string;
    title?: string;
    anonymous?: boolean;
    team?: DeptTeam;
    boardCategory?: BoardCategory;
    peerEmployeeId?: string;
  }) => void;
  createBuddyThread: () => string;
  renameBuddyThread: (threadId: string, title: string) => void;
  appendBuddyUserMessage: (threadId: string, content: string) => void;
  appendBuddyAssistantMessage: (threadId: string, content: string) => void;
  deleteBuddyThread: (threadId: string) => void;
  restoreBuddyThread: (thread: BuddyThread) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const STORAGE_KEY = "ix-compass-state-v8";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seedState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        dispatch({ type: "HYDRATE", payload: parsed });
      }
    } catch {
      // ignore corrupt persisted state and keep seed
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage may be unavailable (e.g. private mode) — safe to ignore
    }
  }, [state, hydrated]);

  const login = useCallback(
    (session: AuthSession) => dispatch({ type: "LOGIN", session }),
    []
  );
  const logout = useCallback(() => dispatch({ type: "LOGOUT" }), []);
  const submitSimulatorAnswer = useCallback(
    (scenarioId: string, choiceId: string, reasoning: string) =>
      dispatch({ type: "SUBMIT_SIMULATOR", scenarioId, choiceId, reasoning }),
    []
  );
  const runContextChecklist = useCallback(
    (week: number, taskText: string, assignmentId?: string) =>
      dispatch({ type: "RUN_CONTEXT_CHECKLIST", week, taskText, assignmentId }),
    []
  );
  const practiceGuide = useCallback(
    (checklistId: string, guideId: string) =>
      dispatch({ type: "PRACTICE_GUIDE", checklistId, guideId }),
    []
  );
  const generateOKRDraft = useCallback(
    (employeeId: string, month: string) =>
      dispatch({ type: "GENERATE_OKR_DRAFT", employeeId, month }),
    []
  );
  const approveOKR = useCallback(
    (id: string) => dispatch({ type: "APPROVE_OKR", id }),
    []
  );
  const rejectOKR = useCallback(
    (id: string) => dispatch({ type: "REJECT_OKR", id }),
    []
  );
  const submitAskQuestion = useCallback(
    (text: string) => dispatch({ type: "SUBMIT_ASK", text }),
    []
  );
  const assignMission = useCallback(
    (payload: {
      employeeId: string;
      templateId?: string;
      week: number;
      title: string;
      description: string;
      dnaFocus: DNAId[];
      dueAt: string;
      priority?: "normal" | "high";
    }) => dispatch({ type: "ASSIGN_MISSION", ...payload }),
    []
  );
  const updateMissionAssignment = useCallback(
    (payload: {
      id: string;
      title: string;
      description: string;
      dnaFocus: DNAId[];
      dueAt: string;
      priority: "normal" | "high";
    }) => dispatch({ type: "UPDATE_MISSION_ASSIGNMENT", ...payload }),
    []
  );
  const submitMissionCheckIn = useCallback(
    (payload: {
      assignmentId: string;
      privateNote?: string;
      artifactNote?: string;
      attachments?: MissionAttachment[];
      generateFeedback?: boolean;
    }) => dispatch({ type: "SUBMIT_MISSION_CHECKIN", ...payload }),
    []
  );
  const generateMissionFeedbackFor = useCallback(
    (assignmentId: string) =>
      dispatch({ type: "GENERATE_MISSION_FEEDBACK", assignmentId }),
    []
  );
  const markMissionFeedbackReviewed = useCallback(
    (id: string, hrInternalNote?: string, hrWeeklyFeedback?: string) =>
      dispatch({
        type: "MARK_MISSION_FEEDBACK_REVIEWED",
        id,
        hrInternalNote,
        hrWeeklyFeedback,
      }),
    []
  );
  const createReviewPacket = useCallback(
    (employeeId: string, period: "3개월" | "6개월") =>
      dispatch({ type: "CREATE_REVIEW_PACKET", employeeId, period }),
    []
  );
  const resetDemo = useCallback(() => dispatch({ type: "RESET" }), []);
  const toggleChecklistItem = useCallback(
    (itemId: string) => dispatch({ type: "TOGGLE_CHECKLIST_ITEM", itemId }),
    []
  );
  const addChecklistItem = useCallback(
    (payload: {
      stage: ChecklistStage;
      title: string;
      description?: string;
    }) => dispatch({ type: "ADD_CHECKLIST_ITEM", ...payload }),
    []
  );
  const updateChecklistItem = useCallback(
    (payload: {
      id: string;
      title: string;
      description?: string;
      stage: ChecklistStage;
    }) => dispatch({ type: "UPDATE_CHECKLIST_ITEM", ...payload }),
    []
  );
  const deleteChecklistItem = useCallback(
    (id: string) => dispatch({ type: "DELETE_CHECKLIST_ITEM", id }),
    []
  );
  const restoreChecklistItem = useCallback(
    (item: ChecklistItemDef) =>
      dispatch({ type: "RESTORE_CHECKLIST_ITEM", item }),
    []
  );
  const addCalendarEvent = useCallback(
    (payload: {
      title: string;
      date: string;
      time?: string;
      type: CalendarEvent["type"];
      description?: string;
    }) =>
      dispatch({
        type: "ADD_CALENDAR_EVENT",
        title: payload.title,
        date: payload.date,
        time: payload.time,
        eventType: payload.type,
        description: payload.description,
      }),
    []
  );
  const updateCalendarEvent = useCallback(
    (payload: {
      id: string;
      title: string;
      date: string;
      time?: string;
      type: CalendarEvent["type"];
      description?: string;
    }) =>
      dispatch({
        type: "UPDATE_CALENDAR_EVENT",
        id: payload.id,
        title: payload.title,
        date: payload.date,
        time: payload.time,
        eventType: payload.type,
        description: payload.description,
      }),
    []
  );
  const deleteCalendarEvent = useCallback(
    (id: string) => dispatch({ type: "DELETE_CALENDAR_EVENT", id }),
    []
  );
  const restoreCalendarEvent = useCallback(
    (event: CalendarEvent) =>
      dispatch({ type: "RESTORE_CALENDAR_EVENT", event }),
    []
  );
  const upsertOkrCard = useCallback(
    (payload: {
      id?: string;
      employeeId: string;
      month: string;
      objectives: OKRObjective[];
      status?: OKRCard["status"];
    }) => dispatch({ type: "UPSERT_OKR_CARD", ...payload }),
    []
  );
  const deleteOkrCard = useCallback(
    (id: string) => dispatch({ type: "DELETE_OKR_CARD", id }),
    []
  );
  const restoreOkrCard = useCallback(
    (card: OKRCard) => dispatch({ type: "RESTORE_OKR_CARD", card }),
    []
  );
  const addCommunityPost = useCallback(
    (payload: {
      channel: CommunityChannel;
      body: string;
      title?: string;
      anonymous?: boolean;
      team?: DeptTeam;
      boardCategory?: BoardCategory;
      peerEmployeeId?: string;
    }) => dispatch({ type: "ADD_COMMUNITY_POST", ...payload }),
    []
  );
  const createBuddyThread = useCallback(() => {
    const id = `thread-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    dispatch({ type: "CREATE_BUDDY_THREAD", id });
    return id;
  }, []);
  const renameBuddyThread = useCallback(
    (threadId: string, title: string) =>
      dispatch({ type: "RENAME_BUDDY_THREAD", threadId, title }),
    []
  );
  const appendBuddyUserMessage = useCallback(
    (threadId: string, content: string) =>
      dispatch({ type: "APPEND_BUDDY_USER_MESSAGE", threadId, content }),
    []
  );
  const appendBuddyAssistantMessage = useCallback(
    (threadId: string, content: string) =>
      dispatch({ type: "APPEND_BUDDY_ASSISTANT_MESSAGE", threadId, content }),
    []
  );
  const deleteBuddyThread = useCallback(
    (threadId: string) => dispatch({ type: "DELETE_BUDDY_THREAD", threadId }),
    []
  );
  const restoreBuddyThread = useCallback(
    (thread: BuddyThread) =>
      dispatch({ type: "RESTORE_BUDDY_THREAD", thread }),
    []
  );

  const currentEmployeeId = state.session?.employeeId ?? DEMO_EMPLOYEE_ID;

  const value = useMemo<StoreValue>(
    () => ({
      state,
      hydrated,
      session: state.session,
      missions: MISSIONS,
      missionTemplates: MISSION_TEMPLATES,
      scenarios: SCENARIOS,
      checklistItems: state.checklistItems,
      currentEmployeeId,
      login,
      logout,
      submitSimulatorAnswer,
      runContextChecklist,
      practiceGuide,
      generateOKRDraft,
      approveOKR,
      rejectOKR,
      upsertOkrCard,
      deleteOkrCard,
      restoreOkrCard,
      submitAskQuestion,
      assignMission,
      updateMissionAssignment,
      submitMissionCheckIn,
      generateMissionFeedbackFor,
      markMissionFeedbackReviewed,
      createReviewPacket,
      resetDemo,
      toggleChecklistItem,
      addChecklistItem,
      updateChecklistItem,
      deleteChecklistItem,
      restoreChecklistItem,
      addCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      restoreCalendarEvent,
      addCommunityPost,
      createBuddyThread,
      renameBuddyThread,
      appendBuddyUserMessage,
      appendBuddyAssistantMessage,
      deleteBuddyThread,
      restoreBuddyThread,
    }),
    [
      state,
      hydrated,
      currentEmployeeId,
      login,
      logout,
      submitSimulatorAnswer,
      runContextChecklist,
      practiceGuide,
      generateOKRDraft,
      approveOKR,
      rejectOKR,
      upsertOkrCard,
      deleteOkrCard,
      restoreOkrCard,
      submitAskQuestion,
      assignMission,
      updateMissionAssignment,
      submitMissionCheckIn,
      generateMissionFeedbackFor,
      markMissionFeedbackReviewed,
      createReviewPacket,
      resetDemo,
      toggleChecklistItem,
      addChecklistItem,
      updateChecklistItem,
      deleteChecklistItem,
      restoreChecklistItem,
      addCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      restoreCalendarEvent,
      addCommunityPost,
      createBuddyThread,
      renameBuddyThread,
      appendBuddyUserMessage,
      appendBuddyAssistantMessage,
      deleteBuddyThread,
      restoreBuddyThread,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
