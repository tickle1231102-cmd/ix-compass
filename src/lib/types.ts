// Domain types for the IX Compass onboarding prototype.
// 12 InterX core values (DNA) — used by intro, missions, and AI work guide.

export type DNAId =
  | "goal_sense"
  | "time_mastery"
  | "grit"
  | "value_solve"
  | "critical_thinking"
  | "innovation_accel"
  | "result_excellence"
  | "growth_drive"
  | "optimistic_challenge"
  | "growth_feedback"
  | "strategic_network"
  | "curiosity";

export interface DNAValue {
  id: DNAId;
  label: string;
  shortLabel: string;
  description: string;
  emoji?: string;
}

export type RiskLevel = "stable" | "watch" | "alert";
export type Phase = "온보딩 교육" | "배치 1개월차" | "배치 3개월차" | "배치 6개월차";

/** Portal login groups — drives nav, home CTAs, and /hr access. */
export type UserRole = "hr" | "newhire";

/** Detail teams a new hire selects before signing in. */
export type DeptTeam = "AX팀" | "PM팀" | "전략팀" | "마케팅팀" | "HR팀";

export interface AuthSession {
  role: UserRole;
  name: string;
  email: string;
  /** Set for new hires only. */
  team?: DeptTeam;
  /** Seed employee profile this session acts as (new hire) or observes (HR). */
  employeeId: string;
  loggedInAt: string;
  /** Temporary one-click demo entry — remove before production. */
  isGuest?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  dept: string;
  cohort: string;
  joinDate: string;
  weekNumber: number;
  phase: Phase;
  riskLevel: RiskLevel;
  isDemoUser?: boolean;
  buddyId?: string;
  mentorId?: string;
}

export type ChecklistStage = "day1" | "week1" | "month1" | "day60" | "day90";

export interface ChecklistItemDef {
  id: string;
  stage: ChecklistStage;
  title: string;
  description?: string;
}

/** Per-employee checked item ids for onboarding checklists. */
export interface ChecklistProgress {
  employeeId: string;
  checkedIds: string[];
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  type: "education" | "meeting" | "review" | "social";
  description?: string;
  employeeId?: string; // undefined = cohort-wide
}

export type CommunityChannel = "board" | "team" | "personal";

/** Board sub-categories. Extend as more sections are added. */
export type BoardCategory = "notice";

export const BOARD_CATEGORY_LABEL: Record<BoardCategory, string> = {
  notice: "공지사항",
};

export interface CommunityPost {
  id: string;
  channel: CommunityChannel;
  authorId: string;
  authorName: string;
  team?: DeptTeam;
  /** For board channel posts. Defaults to notice when omitted (legacy). */
  boardCategory?: BoardCategory;
  /** For personal channel: the counterpart employee id (new hire). */
  peerEmployeeId?: string;
  title?: string;
  body: string;
  anonymous: boolean;
  createdAt: string;
}

export interface BuddyMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface BuddyThread {
  id: string;
  employeeId: string;
  title: string;
  messages: BuddyMessage[];
  createdAt: string;
  updatedAt: string;
}

export type LibraryCategory =
  | "인사/복리후생"
  | "보안"
  | "개발환경"
  | "문화"
  | "제품/도메인";

export interface LibraryDoc {
  id: string;
  category: LibraryCategory;
  title: string;
  summary: string;
  url: string;
  keywords: string[];
}

export interface OrgMember {
  id: string;
  name: string;
  team: DeptTeam | string;
  role: string;
  email: string;
  bio: string;
}

export interface DNAEvidence {
  id: string;
  employeeId: string;
  dnaId: DNAId;
  source: "simulator" | "mission" | "checklist";
  sourceLabel: string;
  snippet: string;
  week: number;
  createdAt: string;
}

/** A single "오늘의 실천 가이드" line, scoped to one DNA value. */
export interface ActionGuide {
  id: string;
  dnaId: DNAId;
  text: string;
}

/**
 * Context Checklist Agent output — replaces the old "check all 12 values
 * every day" pattern. The employee describes today's actual task; the AI
 * narrows it down to the 3~4 most relevant DNA values and a short,
 * do-today action list instead of a 12-item form.
 */
export interface ContextChecklist {
  id: string;
  employeeId: string;
  week: number;
  taskText: string;
  relevantDnaIds: DNAId[];
  matchedKeywords: string[];
  rationale: string;
  guides: ActionGuide[];
  practicedGuideIds: string[];
  /** Links guide session to a mission assignment when launched from 내 미션. */
  assignmentId?: string;
  createdAt: string;
}

/** Static week 1–4 template used when HR assigns missions. */
export interface MissionTemplate {
  id: string;
  week: number;
  title: string;
  description: string;
  dnaFocus: DNAId[];
}

/** @deprecated Use MissionTemplate — kept as alias for seed helpers. */
export type MissionDef = MissionTemplate;

export type Sentiment = "positive" | "neutral" | "risk";

export type MissionAssignmentStatus =
  | "assigned"
  | "in_progress"
  | "awaiting_review"
  | "completed";

export interface MissionAssignment {
  id: string;
  employeeId: string;
  templateId?: string;
  week: number;
  title: string;
  description: string;
  dnaFocus: DNAId[];
  dueAt: string;
  status: MissionAssignmentStatus;
  assignedAt: string;
  assignedBy: "hr" | "system";
  priority: "normal" | "high";
}

export type MissionAttachmentKind = "pdf" | "word" | "text" | "other";

/** Deliverable attached when submitting for AI feedback (demo: stored locally). */
export interface MissionAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: MissionAttachmentKind;
  /** Plain-text body or extracted preview for AI (never shown raw to HR). */
  textContent?: string;
  /** Small files may keep a data URL for local re-open; optional. */
  dataUrl?: string;
}

export interface MissionCheckIn {
  id: string;
  assignmentId: string;
  employeeId: string;
  /** Private blocker note — AI only; never shown to HR. */
  privateNote?: string;
  /** Optional structured artifact (link or short label). */
  artifactNote?: string;
  /** Submitted deliverable files / text for AI feedback. */
  attachments?: MissionAttachment[];
  guideSessionIds: string[];
  createdAt: string;
}

export interface MissionFeedbackForNewhire {
  coachText: string;
  nextActions: string[];
}

/** HR-safe DTO — never includes private notes or raw check-in text. */
export interface MissionFeedbackForHr {
  summary: string;
  progressPct: number;
  riskLevel: RiskLevel;
  interventionHint: string;
  artifactCount: number;
  practicedGuideCount: number;
}

export interface MissionFeedback {
  id: string;
  assignmentId: string;
  employeeId: string;
  week: number;
  missionTitle: string;
  forNewhire: MissionFeedbackForNewhire;
  forHr: MissionFeedbackForHr;
  generatedAt: string;
  hrReviewed: boolean;
  /** Internal HR note — not visible to newhire. */
  hrInternalNote?: string;
}

/** Row returned to HR Mission Progress Copilot (forHr only). */
export interface HrMissionReviewItem {
  feedbackId: string;
  assignmentId: string;
  employeeId: string;
  employeeName: string;
  dept: string;
  week: number;
  missionTitle: string;
  forHr: MissionFeedbackForHr;
  generatedAt: string;
}

export type ChoiceTone = "strong" | "ok" | "risky";

export interface SimulatorChoice {
  id: string;
  label: string;
  dnaId: DNAId;
  tone: ChoiceTone;
  feedback: string;
}

export interface SimulatorScenario {
  id: string;
  week: number;
  title: string;
  context: string;
  choices: SimulatorChoice[];
}

export interface SimulatorAttempt {
  id: string;
  employeeId: string;
  scenarioId: string;
  choiceId: string;
  dnaId: DNAId;
  reasoning: string;
  aiFeedback: string;
  createdAt: string;
}

export interface OKRKeyResult {
  text: string;
  progress: number;
}

export interface OKRObjective {
  title: string;
  keyResults: OKRKeyResult[];
  dnaLinked: DNAId[];
}

export type OKRStatus = "draft" | "approved";

export interface OKRCard {
  id: string;
  employeeId: string;
  month: string;
  objectives: OKRObjective[];
  status: OKRStatus;
  source: "ai-draft" | "manual";
  generatedAt: string;
}

export interface RiskNote {
  employeeId: string;
  week: number;
  level: RiskLevel;
  reason: string;
  suggestedAction: string;
}

export interface FAQEntry {
  id: string;
  keywords: string[];
  answer: string;
}

export interface AskQuestion {
  id: string;
  text: string;
  answer: string;
  matched: boolean;
  escalated: boolean;
  createdAt: string;
}

export interface ReviewPacket {
  id: string;
  employeeId: string;
  period: "3개월" | "6개월";
  generatedAt: string;
  dnaSummary: { dnaId: DNAId; score: number; evidenceCount: number }[];
  okrHistory: OKRCard[];
  growthNote: string;
  riskNote: string;
  recommendation: string;
}
