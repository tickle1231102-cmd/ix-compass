import {
  analyzeTaskContext,
  anonymizeFeedback,
  computeRiskNote,
  draftOKRFromEvidence,
  generateMissionFeedback,
  type AnonymizedFeedback,
  type MissionRiskSignals,
} from "@/lib/ai";
import type {
  ActionGuide,
  DNAEvidence,
  DNAId,
  MissionAssignment,
  MissionCheckIn,
  MissionFeedbackForHr,
  MissionFeedbackForNewhire,
  OKRCard,
  RiskLevel,
  ContextChecklist,
} from "@/lib/types";

export type ChecklistResult = {
  relevantDnaIds: DNAId[];
  matchedKeywords: string[];
  rationale: string;
  guides: ActionGuide[];
};

export type MissionFeedbackResult = {
  forNewhire: MissionFeedbackForNewhire;
  forHr: MissionFeedbackForHr;
  dnaTags: DNAId[];
};

export type RiskNoteResult = {
  level: RiskLevel;
  reason: string;
  suggestedAction: string;
};

async function postJson<T>(
  path: string,
  body: unknown,
  fallback: () => T
): Promise<{ data: T; source: "gemini" | "fallback" }> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${path} ${res.status}`);
    const json = (await res.json()) as {
      source?: unknown;
      result?: unknown;
      draft?: unknown;
      notes?: unknown;
    };
    if (path.includes("okr-draft") && json.draft) {
      return {
        data: json.draft as T,
        source: json.source === "gemini" ? "gemini" : "fallback",
      };
    }
    if (path.includes("risk-notes") && Array.isArray(json.notes)) {
      return {
        data: json.notes as T,
        source: json.source === "gemini" ? "gemini" : "fallback",
      };
    }
    if (json.result) {
      return {
        data: json.result as T,
        source: json.source === "gemini" ? "gemini" : "fallback",
      };
    }
    throw new Error("empty_ai_payload");
  } catch {
    return { data: fallback(), source: "fallback" };
  }
}

export async function askChecklist(
  taskText: string,
  weekFallbackDna: DNAId[] = []
): Promise<ChecklistResult> {
  const { data } = await postJson<ChecklistResult>(
    "/api/ai/checklist",
    { taskText, weekFallbackDna },
    () => analyzeTaskContext(taskText, weekFallbackDna)
  );
  return data;
}

export async function askMissionFeedback(payload: {
  assignment: MissionAssignment;
  checkIns: MissionCheckIn[];
  guides: ContextChecklist[];
}): Promise<MissionFeedbackResult> {
  const { data } = await postJson<MissionFeedbackResult>(
    "/api/ai/mission-feedback",
    payload,
    () =>
      generateMissionFeedback(
        payload.assignment,
        payload.checkIns,
        payload.guides
      )
  );
  return data;
}

export async function askOkrDraft(payload: {
  evidence: DNAEvidence[];
  employeeId: string;
  employeeName?: string;
  month: string;
}): Promise<OKRCard> {
  const { data } = await postJson<OKRCard>(
    "/api/ai/okr-draft",
    payload,
    () =>
      draftOKRFromEvidence(
        payload.evidence,
        payload.employeeId,
        payload.month
      )
  );
  return data;
}

export async function askAnonymize(text: string): Promise<AnonymizedFeedback> {
  const { data } = await postJson<AnonymizedFeedback>(
    "/api/ai/anonymize",
    { text },
    () => anonymizeFeedback(text)
  );
  return data;
}

export async function askRiskNotes(
  items: {
    employeeId: string;
    employeeName?: string;
    signals: MissionRiskSignals;
  }[]
): Promise<
  { employeeId: string; note: RiskNoteResult; source: "gemini" | "fallback" }[]
> {
  const { data } = await postJson<
    { employeeId: string; note: RiskNoteResult; source?: "gemini" | "fallback" }[]
  >("/api/ai/risk-notes", { items }, () =>
    items.map((item) => ({
      employeeId: item.employeeId,
      note: computeRiskNote(item.employeeId, 0, item.signals),
      source: "fallback" as const,
    }))
  );
  return data.map((row) => ({
    employeeId: row.employeeId,
    note: row.note,
    source: row.source === "gemini" ? "gemini" : "fallback",
  }));
}
