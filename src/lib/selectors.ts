import {
  CHECKLIST_ITEMS,
  CHECKLIST_STAGE_LABEL,
  DNA_VALUES,
  LIBRARY_CATEGORIES,
  SEED_LIBRARY_DOCS,
  SEED_ORG_MEMBERS,
} from "./seed";
import type {
  BuddyThread,
  BoardCategory,
  CalendarEvent,
  ChecklistItemDef,
  ChecklistProgress,
  ChecklistStage,
  CommunityPost,
  ContextChecklist,
  DeptTeam,
  DNAEvidence,
  Employee,
  HrMissionReviewItem,
  LibraryDoc,
  MissionAssignment,
  MissionCheckIn,
  MissionFeedback,
  OKRCard,
  OrgMember,
} from "./types";
import type { MissionRiskSignals } from "./ai";

export interface QueryableState {
  employees: Employee[];
  evidence: DNAEvidence[];
  okrCards: OKRCard[];
  contextChecklists: ContextChecklist[];
  checklistItems?: ChecklistItemDef[];
  checklistProgress: ChecklistProgress[];
  calendarEvents: CalendarEvent[];
  communityPosts: CommunityPost[];
  buddyThreads: BuddyThread[];
  missionAssignments: MissionAssignment[];
  missionCheckIns: MissionCheckIn[];
  missionFeedbacks: MissionFeedback[];
}

export { CHECKLIST_STAGE_LABEL, LIBRARY_CATEGORIES };

function checklistDefs(state: QueryableState): ChecklistItemDef[] {
  return state.checklistItems && state.checklistItems.length > 0
    ? state.checklistItems
    : CHECKLIST_ITEMS;
}

export function getEmployeeById(
  state: QueryableState,
  employeeId: string
): Employee | undefined {
  return state.employees.find((e) => e.id === employeeId);
}

export function getEvidenceForEmployee(
  state: QueryableState,
  employeeId: string
) {
  return state.evidence.filter((e) => e.employeeId === employeeId);
}

export function getDnaScores(state: QueryableState, employeeId: string) {
  const evidence = getEvidenceForEmployee(state, employeeId);
  const counts = new Map<string, number>();
  for (const ev of evidence) {
    counts.set(ev.dnaId, (counts.get(ev.dnaId) ?? 0) + 1);
  }
  return DNA_VALUES.map((dna) => {
    const count = counts.get(dna.id) ?? 0;
    return {
      dnaId: dna.id,
      label: dna.label,
      shortLabel: dna.shortLabel,
      description: dna.description,
      count,
      score: Math.min(100, count * 25),
    };
  });
}

export function getOkrCardsForEmployee(
  state: QueryableState,
  employeeId: string
) {
  return state.okrCards
    .filter((c) => c.employeeId === employeeId)
    .sort((a, b) => (a.month < b.month ? 1 : -1));
}

export function getApprovedOkrForEmployee(
  state: QueryableState,
  employeeId: string
) {
  return getOkrCardsForEmployee(state, employeeId).filter(
    (c) => c.status === "approved"
  );
}

export function getDraftOkrForEmployee(
  state: QueryableState,
  employeeId: string
) {
  return getOkrCardsForEmployee(state, employeeId).find(
    (c) => c.status === "draft"
  );
}

export function getAssignmentsForEmployee(
  state: QueryableState,
  employeeId: string
): MissionAssignment[] {
  return state.missionAssignments
    .filter((a) => a.employeeId === employeeId)
    .sort((a, b) => b.week - a.week || a.dueAt.localeCompare(b.dueAt));
}

export function getActiveAssignmentForEmployee(
  state: QueryableState,
  employeeId: string
): MissionAssignment | undefined {
  const open = getAssignmentsForEmployee(state, employeeId).filter(
    (a) => a.status !== "completed"
  );
  return open[0];
}

export function getAssignmentById(
  state: QueryableState,
  assignmentId: string
): MissionAssignment | undefined {
  return state.missionAssignments.find((a) => a.id === assignmentId);
}

export function getCheckInsForAssignment(
  state: QueryableState,
  assignmentId: string
): MissionCheckIn[] {
  return state.missionCheckIns
    .filter((c) => c.assignmentId === assignmentId)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

/** Newhire-safe check-ins (includes privateNote for AI / self view only). */
export function getCheckInsForEmployee(
  state: QueryableState,
  employeeId: string
): MissionCheckIn[] {
  return state.missionCheckIns
    .filter((c) => c.employeeId === employeeId)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getGuidesForAssignment(
  state: QueryableState,
  assignmentId: string
): ContextChecklist[] {
  return state.contextChecklists
    .filter((c) => c.assignmentId === assignmentId)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getFeedbackForAssignment(
  state: QueryableState,
  assignmentId: string
): MissionFeedback | undefined {
  return state.missionFeedbacks
    .filter((f) => f.assignmentId === assignmentId)
    .sort(
      (a, b) =>
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    )[0];
}

export function getFeedbacksForEmployee(
  state: QueryableState,
  employeeId: string
): MissionFeedback[] {
  return state.missionFeedbacks
    .filter((f) => f.employeeId === employeeId)
    .sort(
      (a, b) =>
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
}

/**
 * HR Mission Progress Copilot queue — forHr fields only.
 * Never exposes private notes or raw check-in text.
 */
export function getHrMissionReviewQueue(
  state: QueryableState
): HrMissionReviewItem[] {
  return state.missionFeedbacks
    .filter((f) => !f.hrReviewed)
    .sort(
      (a, b) =>
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    )
    .map((f) => {
      const emp = getEmployeeById(state, f.employeeId);
      return {
        feedbackId: f.id,
        assignmentId: f.assignmentId,
        employeeId: f.employeeId,
        employeeName: emp?.name ?? "알 수 없음",
        dept: emp?.dept ?? "",
        week: f.week,
        missionTitle: f.missionTitle,
        forHr: f.forHr,
        generatedAt: f.generatedAt,
      };
    });
}

export function getMissionRiskSignalsForEmployee(
  state: QueryableState,
  employeeId: string
): MissionRiskSignals {
  const feedbacks = state.missionFeedbacks.filter(
    (f) => f.employeeId === employeeId
  );
  const assignments = state.missionAssignments.filter(
    (a) => a.employeeId === employeeId
  );
  const now = Date.now();
  let overdueLowProgressCount = 0;
  for (const a of assignments) {
    if (a.status === "completed") continue;
    const fb = getFeedbackForAssignment(state, a.id);
    const pct = fb?.forHr.progressPct ?? 0;
    if (new Date(a.dueAt).getTime() < now && pct < 80) {
      overdueLowProgressCount += 1;
    }
  }
  return {
    alertCount: feedbacks.filter((f) => f.forHr.riskLevel === "alert").length,
    watchCount: feedbacks.filter((f) => f.forHr.riskLevel === "watch").length,
    overdueLowProgressCount,
  };
}

export function computeAssignmentProgressPct(
  state: QueryableState,
  assignmentId: string
): number {
  const assignment = getAssignmentById(state, assignmentId);
  if (!assignment) return 0;
  const checkIns = getCheckInsForAssignment(state, assignmentId);
  const guides = getGuidesForAssignment(state, assignmentId);
  const criteriaTotal = Math.max(1, assignment.successCriteria.length);
  const doneSet = new Set<string>();
  for (const c of checkIns) {
    for (const id of c.doneCriteriaIds) doneSet.add(id);
  }
  const criteriaDone = Math.min(criteriaTotal, doneSet.size);
  const practiced = guides.reduce((s, g) => s + g.practicedGuideIds.length, 0);
  return Math.min(
    100,
    Math.round((criteriaDone / criteriaTotal) * 70) + Math.min(30, practiced * 10)
  );
}

export function getChecklistsForEmployee(
  state: QueryableState,
  employeeId: string
) {
  return state.contextChecklists
    .filter((c) => c.employeeId === employeeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getLatestChecklistForEmployee(
  state: QueryableState,
  employeeId: string
) {
  return getChecklistsForEmployee(state, employeeId)[0];
}

export function getChecklistProgress(
  state: QueryableState,
  employeeId: string
): ChecklistProgress | undefined {
  return state.checklistProgress.find((p) => p.employeeId === employeeId);
}

export function getChecklistStats(state: QueryableState, employeeId: string) {
  const progress = getChecklistProgress(state, employeeId);
  const checkedSet = new Set(progress?.checkedIds ?? []);
  const items = checklistDefs(state);
  const total = items.length;
  const checked = items.filter((item) => checkedSet.has(item.id)).length;
  const percent = total === 0 ? 0 : Math.round((checked / total) * 100);

  const stages: ChecklistStage[] = [
    "day1",
    "week1",
    "month1",
    "day60",
    "day90",
  ];
  const byStage = Object.fromEntries(
    stages.map((stage) => {
      const stageItems = items.filter((item) => item.stage === stage);
      const stageChecked = stageItems.filter((item) =>
        checkedSet.has(item.id)
      ).length;
      return [stage, { total: stageItems.length, checked: stageChecked }];
    })
  ) as Record<ChecklistStage, { total: number; checked: number }>;

  return { total, checked, percent, byStage };
}

export function getUncheckedChecklistItems(
  state: QueryableState,
  employeeId: string,
  limit?: number
): ChecklistItemDef[] {
  const progress = getChecklistProgress(state, employeeId);
  const checkedSet = new Set(progress?.checkedIds ?? []);
  const unchecked = checklistDefs(state).filter(
    (item) => !checkedSet.has(item.id)
  );
  return limit !== undefined ? unchecked.slice(0, limit) : unchecked;
}

export function getOkrCardsForMonth(state: QueryableState, month: string) {
  return state.okrCards
    .filter((c) => c.month === month)
    .sort((a, b) => a.employeeId.localeCompare(b.employeeId));
}

export function getCalendarEventsForMonth(
  state: QueryableState,
  year: number,
  month: number
): CalendarEvent[] {
  return state.calendarEvents
    .filter((ev) => {
      const [y, m] = ev.date.split("-").map(Number);
      return y === year && m === month + 1;
    })
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.time ?? "").localeCompare(b.time ?? "");
    });
}

export function getTodayEvents(
  state: QueryableState,
  employeeId: string,
  todayISO: string
): CalendarEvent[] {
  return state.calendarEvents
    .filter(
      (ev) =>
        ev.date === todayISO &&
        (ev.employeeId === undefined || ev.employeeId === employeeId)
    )
    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
}

export function getBoardPosts(
  state: QueryableState,
  category: BoardCategory = "notice"
): CommunityPost[] {
  return state.communityPosts
    .filter((p) => {
      if (p.channel !== "board") return false;
      const cat = p.boardCategory ?? "notice";
      return cat === category;
    })
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getTeamPosts(
  state: QueryableState,
  team: DeptTeam
): CommunityPost[] {
  return state.communityPosts
    .filter((p) => p.channel === "team" && p.team === team)
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getPersonalPosts(
  state: QueryableState,
  peerEmployeeId: string
): CommunityPost[] {
  return state.communityPosts
    .filter(
      (p) => p.channel === "personal" && p.peerEmployeeId === peerEmployeeId
    )
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
}

/** HR inbox: anonymized feedback submissions (author identity never exposed). */
export function getAnonymousFeedbackPosts(
  state: QueryableState
): CommunityPost[] {
  return state.communityPosts
    .filter(
      (p) =>
        p.channel === "personal" &&
        p.anonymous === true &&
        p.title === "익명 피드백"
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getAllPersonalThreadsForHr(state: QueryableState) {
  const personalPosts = state.communityPosts.filter(
    (p) => p.channel === "personal" && p.peerEmployeeId
  );
  const latestByPeer = new Map<string, CommunityPost>();
  for (const post of personalPosts) {
    const peerId = post.peerEmployeeId!;
    const existing = latestByPeer.get(peerId);
    if (
      !existing ||
      new Date(post.createdAt).getTime() > new Date(existing.createdAt).getTime()
    ) {
      latestByPeer.set(peerId, post);
    }
  }
  return [...latestByPeer.entries()]
    .map(([peerEmployeeId, latestPost]) => ({ peerEmployeeId, latestPost }))
    .sort(
      (a, b) =>
        new Date(b.latestPost.createdAt).getTime() -
        new Date(a.latestPost.createdAt).getTime()
    );
}

export function getBuddyThreads(
  state: QueryableState,
  employeeId: string
): BuddyThread[] {
  return state.buddyThreads
    .filter((t) => t.employeeId === employeeId)
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export function getBuddyThread(
  state: QueryableState,
  threadId: string
): BuddyThread | undefined {
  return state.buddyThreads.find((t) => t.id === threadId);
}

export function getOrgMember(id: string): OrgMember | undefined {
  return SEED_ORG_MEMBERS.find((m) => m.id === id);
}

export function getOrgMembersByTeam(): Record<string, OrgMember[]> {
  const grouped: Record<string, OrgMember[]> = {};
  for (const member of SEED_ORG_MEMBERS) {
    const team = member.team;
    if (!grouped[team]) grouped[team] = [];
    grouped[team].push(member);
  }
  return grouped;
}

export function searchLibraryDocs(query: string): LibraryDoc[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...SEED_LIBRARY_DOCS];
  return SEED_LIBRARY_DOCS.filter(
    (doc) =>
      doc.title.toLowerCase().includes(q) ||
      doc.summary.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      doc.keywords.some((kw) => kw.toLowerCase().includes(q))
  );
}
