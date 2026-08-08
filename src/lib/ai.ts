// Simulated AI layer for the prototype.
//
// This module stands in for real LLM calls (e.g. an LLM API + RAG over
// internal docs) so the prototype runs fully offline and deterministically
// during a live demo. Every function below is written as a small, isolated
// "agent" with a single responsibility — swapping the body for a real model
// call later does not require touching any calling page.

import type {
  ActionGuide,
  ContextChecklist,
  DNAId,
  DNAEvidence,
  Employee,
  FAQEntry,
  MissionAssignment,
  MissionCheckIn,
  MissionFeedbackForHr,
  MissionFeedbackForNewhire,
  OKRCard,
  OKRObjective,
  ReviewPacket,
  RiskLevel,
} from "./types";
import { ACTION_GUIDES_BY_DNA, DNA_KEYWORDS, DNA_MAP, FAQS, CHECKLIST_ITEMS, SEED_LIBRARY_DOCS } from "./seed";

const PRIVATE_RISK_KEYWORDS = [
  "힘들",
  "모르겠",
  "막막",
  "외롭",
  "지친",
  "지쳐",
  "포기",
  "불안",
  "눈치",
  "혼자",
  "자신이 없",
  "어색",
];

/**
 * Mission Progress Copilot — dual-channel feedback.
 * forHr NEVER includes private note wording; only aggregated signals.
 */
export function generateMissionFeedback(
  assignment: MissionAssignment,
  checkIns: MissionCheckIn[],
  guideSessions: ContextChecklist[]
): {
  forNewhire: MissionFeedbackForNewhire;
  forHr: MissionFeedbackForHr;
  dnaTags: DNAId[];
} {
  const practicedGuideCount = guideSessions.reduce(
    (sum, g) => sum + g.practicedGuideIds.length,
    0
  );

  const attachments = checkIns.flatMap((c) => c.attachments ?? []);
  const artifactLabels = [
    ...attachments.map((a) => a.name),
    ...checkIns.map((c) => c.artifactNote?.trim()).filter(Boolean),
  ] as string[];
  const artifactCount =
    attachments.length +
    checkIns.filter((c) => c.artifactNote?.trim()).length;
  const textPreview = attachments
    .filter((a) => a.kind === "text" && a.textContent)
    .map((a) => a.textContent!.slice(0, 280))
    .join(" ");

  const deliverablePct =
    artifactCount === 0 ? 0 : Math.min(60, 35 + artifactCount * 15);
  const guidePct = Math.min(40, practicedGuideCount * 12);
  const progressPct = Math.min(100, deliverablePct + guidePct);

  const overdue =
    new Date(assignment.dueAt).getTime() < Date.now() && progressPct < 80;
  const privateBlob = checkIns
    .map((c) => c.privateNote ?? "")
    .join(" ");
  const hasPrivateRisk = PRIVATE_RISK_KEYWORDS.some((k) =>
    privateBlob.includes(k)
  );

  let riskLevel: RiskLevel = "stable";
  if ((overdue && progressPct < 40) || (hasPrivateRisk && progressPct < 50)) {
    riskLevel = "alert";
  } else if (overdue || hasPrivateRisk || progressPct < 50) {
    riskLevel = "watch";
  }

  const focusDna = assignment.dnaFocus[0]
    ? DNA_MAP.get(assignment.dnaFocus[0])
    : undefined;

  const nextActions: string[] = [
    focusDna
      ? `"${focusDna.label}"를 팀에 한 줄로 공유`
      : "이번 주 성과를 한 줄로 정리",
    "제출한 결과물을 다음 액션 1개로 이어서 실행하기",
  ];

  if (practicedGuideCount < 2) {
    nextActions.unshift("AI 업무 가이드 실천 2건 이상 완료하기");
  }

  const deliverableLine =
    artifactCount > 0
      ? `제출한 결과물 ${artifactCount}건(${artifactLabels.slice(0, 3).join(", ")}${
          artifactLabels.length > 3 ? " 외" : ""
        })을 기준으로 피드백했어요.`
      : "결과물 첨부가 없어 가이드 실천만으로 피드백했어요.";

  let coachText: string;
  if (progressPct >= 80) {
    coachText = `미션 「${assignment.title}」 진행이 좋아요 (${progressPct}%). ${deliverableLine} ${
      focusDna ? `"${focusDna.label}" ` : ""
    }핵심가치가 실천으로 잘 이어지고 있어요.`;
  } else if (hasPrivateRisk) {
    coachText = `진행 ${progressPct}%예요. ${deliverableLine} 막히는 느낌이 있어도 괜찮아요 — 프라이빗 노트와 결과물 원문은 AI만 보고, 인사팀에는 진행률·요약만 전달됩니다.`;
  } else if (textPreview) {
    coachText = `미션 「${assignment.title}」 현재 ${progressPct}%예요. ${deliverableLine} 제출 텍스트 요지: “${textPreview.slice(0, 120)}${textPreview.length > 120 ? "…" : ""}”. 아래 다음 액션부터 이어서 정리해 보세요.`;
  } else {
    coachText = `미션 「${assignment.title}」 현재 ${progressPct}%예요. ${deliverableLine} 가이드 실천 ${practicedGuideCount}건. 아래 다음 액션부터 하나씩 체크해 보세요.`;
  }

  if (artifactCount === 0) {
    nextActions.unshift("PDF·워드·텍스트 등 결과물을 첨부해 다시 제출하기");
  }

  const forNewhire: MissionFeedbackForNewhire = {
    coachText,
    nextActions: nextActions.slice(0, 3),
  };

  // HR channel: aggregates only — never echo private notes or file text.
  const deliverableAgg =
    artifactCount > 0
      ? `결과물 ${artifactCount}건 제출됨`
      : "결과물 미제출";
  let summary: string;
  let interventionHint: string;
  if (riskLevel === "alert") {
    summary = `${assignment.week}주차 미션 「${assignment.title}」 진행 ${progressPct}%. 가이드 실천 ${practicedGuideCount}건, ${deliverableAgg}. 지연·저참여 신호가 있습니다.`;
    interventionHint = "이번 주 안에 버디·멘토 1:1 체크인을 잡아보세요.";
  } else if (riskLevel === "watch") {
    summary = `${assignment.week}주차 미션 「${assignment.title}」 진행 ${progressPct}%. 가이드 실천 ${practicedGuideCount}건, ${deliverableAgg}. 회복 여부를 지켜볼 단계입니다.`;
    interventionHint = "다음 제출에서 진행이 회복되는지 가볍게 확인해 주세요.";
  } else {
    summary = `${assignment.week}주차 미션 「${assignment.title}」 진행 ${progressPct}%. 가이드 실천 ${practicedGuideCount}건, ${deliverableAgg}. 안정적 수행 흐름입니다.`;
    interventionHint = "특별한 개입 없이 현재 흐름을 유지해도 좋아요.";
  }

  const forHr: MissionFeedbackForHr = {
    summary,
    progressPct,
    riskLevel,
    interventionHint,
    artifactCount,
    practicedGuideCount,
  };

  return {
    forNewhire,
    forHr,
    dnaTags: progressPct >= 40 ? assignment.dnaFocus.slice(0, 1) : [],
  };
}

/** Coach Agent — evaluates a Decision Simulator choice + free-text reasoning. */
export function evaluateSimulatorAnswer(
  baseFeedback: string,
  reasoning: string
): string {
  const trimmed = reasoning.trim();
  if (trimmed.length === 0) {
    return baseFeedback;
  }
  if (trimmed.length < 20) {
    return `${baseFeedback} 다만 근거가 조금 짧아요 — "왜" 그렇게 판단했는지 한두 문장만 더 적으면 핵심가치 근거의 신뢰도가 올라가요.`;
  }
  return `${baseFeedback} 특히 근거를 구체적으로 서술해주셔서 이 선택은 신뢰도 높은 핵심가치 근거로 기록됐어요.`;
}

const DEFAULT_DNA_FALLBACK: DNAId[] = [
  "curiosity",
  "growth_drive",
  "result_excellence",
];

/**
 * Context Checklist Agent — ranks the 12 core values for today's task,
 * keeps the top 3, and returns exactly 3 checklist tips (one per value).
 */
export function analyzeTaskContext(
  taskText: string,
  weekFallbackDna: DNAId[] = []
): {
  relevantDnaIds: DNAId[];
  matchedKeywords: string[];
  rationale: string;
  guides: ActionGuide[];
} {
  const normalized = taskText.toLowerCase();
  const matchedKeywords: string[] = [];
  const scored: { dnaId: DNAId; score: number }[] = [];

  for (const [dnaId, keywords] of Object.entries(DNA_KEYWORDS) as [
    DNAId,
    string[]
  ][]) {
    const hits = keywords.filter((k) => normalized.includes(k.toLowerCase()));
    let score = hits.length;
    // Mission focus DNA get a small boost when relevant to the assigned week.
    if (weekFallbackDna.includes(dnaId)) score += 0.5;
    if (score > 0) {
      scored.push({ dnaId, score });
      matchedKeywords.push(...hits);
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const keywordDnaIds: DNAId[] = scored.slice(0, 3).map((s) => s.dnaId);
  const relevantDnaIds: DNAId[] = [...keywordDnaIds];

  const fillerDnaIds: DNAId[] = [];
  if (relevantDnaIds.length < 3) {
    const fillers = [...weekFallbackDna, ...DEFAULT_DNA_FALLBACK];
    for (const id of fillers) {
      if (relevantDnaIds.length >= 3) break;
      if (!relevantDnaIds.includes(id)) {
        relevantDnaIds.push(id);
        fillerDnaIds.push(id);
      }
    }
  }
  relevantDnaIds.splice(3);

  const shortLabel = (id: DNAId) => DNA_MAP.get(id)?.shortLabel ?? id;
  const uniqueKeywords = Array.from(new Set(matchedKeywords)).slice(0, 5);

  let rationale: string;
  if (keywordDnaIds.length > 0 && fillerDnaIds.length === 0) {
    rationale = `입력하신 업무에서 "${uniqueKeywords.join(
      ", "
    )}" 신호가 강해 ${relevantDnaIds
      .map(shortLabel)
      .join(
        ", "
      )} 핵심가치 3가지를 우선순위로 골랐어요. 오늘은 이 3개만 체크하면 됩니다.`;
  } else if (keywordDnaIds.length > 0 && fillerDnaIds.length > 0) {
    rationale = `"${uniqueKeywords.join(", ")}" 신호로 ${keywordDnaIds
      .map(shortLabel)
      .join(", ")}를 뽑았고, 부족분은 미션 초점 ${fillerDnaIds
      .map(shortLabel)
      .join(", ")}로 채워 총 3개 체크리스트를 만들었어요.`;
  } else {
    rationale = `뚜렷한 업무 키워드가 없어 이번 주 미션 초점(${relevantDnaIds
      .map(shortLabel)
      .join(", ")}) 기준으로 가장 중요한 3가지만 제시했어요.`;
  }

  // Exactly one tip per selected DNA → 3 checklist items.
  const guides: ActionGuide[] = relevantDnaIds
    .map((id) => ACTION_GUIDES_BY_DNA.get(id)?.[0])
    .filter((g): g is ActionGuide => Boolean(g))
    .slice(0, 3);

  return { relevantDnaIds, matchedKeywords: uniqueKeywords, rationale, guides };
}

/** Ask Anything Copilot — keyword-matches a question against the FAQ set. */
export function matchFAQ(question: string): {
  answer: string;
  matched: boolean;
  faq?: FAQEntry;
} {
  const normalized = question.replace(/\s/g, "");
  let best: { faq: FAQEntry; score: number } | null = null;

  for (const faq of FAQS) {
    const score = faq.keywords.filter((k) => normalized.includes(k)).length;
    if (score > 0 && (!best || score > best.score)) {
      best = { faq, score };
    }
  }

  if (best) {
    return { answer: best.faq.answer, matched: true, faq: best.faq };
  }

  return {
    answer:
      "아직 정확한 답변을 찾지 못했어요. 익명으로 HR팀에 바로 전달했고, 빠르게 답변 드릴게요.",
    matched: false,
  };
}

const OKR_TEMPLATES: Record<DNAId, { objective: string; kr: string[] }> = {
  goal_sense: {
    objective: "조직 목표와 연결된 정량 목표를 세운다",
    kr: [
      "선행·후행 지표를 포함한 주간 목표 카드 1건",
      "목표 대비 진행률을 수치로 공유 2회",
    ],
  },
  time_mastery: {
    objective: "자동화로 시간을 확보하고 마감을 지킨다",
    kr: ["반복 업무 자동화/툴 적용 1건", "마감 준수율 100% 유지"],
  },
  grit: {
    objective: "실패를 학습으로 바꿔 끝까지 해결한다",
    kr: ["실패-재시도 기록 2건", "난이도 높은 과제 완결 1건"],
  },
  value_solve: {
    objective: "고객·시장 관점에서 문제 본질을 푼다",
    kr: ["문제 재정의 메모 1건", "구조적 해결 제안 1건"],
  },
  critical_thinking: {
    objective: "데이터로 기존 방식을 비판적으로 개선한다",
    kr: ["데이터 근거 의사결정 사례 2건", "대안 전략 비교 노트 1건"],
  },
  innovation_accel: {
    objective: "AI·새 기술로 프로세스를 가속한다",
    kr: ["업무 AI/툴 적용 사례 2건", "프로세스 개선 제안 1건"],
  },
  result_excellence: {
    objective: "결과물의 완성도와 품질을 최고 수준으로 유지한다",
    kr: ["완결 산출물 2건 이상 제출", "품질 체크리스트 준수율 기록"],
  },
  growth_drive: {
    objective: "일의 의미를 이해하고 스스로 성장을 주도한다",
    kr: ["학습→실무 적용 사례 2건", "자발적 개선 과제 1건"],
  },
  optimistic_challenge: {
    objective: "변화 속에서도 낙관적으로 도전을 이어간다",
    kr: ["도전 과제 첫 실행 스텝 제안 2건", "팀에 긍정적 공유 1건"],
  },
  growth_feedback: {
    objective: "성장지향 피드백을 주고받는다",
    kr: ["피드백 전달 2건", "피드백 반영 기록 1건"],
  },
  strategic_network: {
    objective: "신뢰 기반 네트워크로 시너지를 만든다",
    kr: ["이해관계자 정렬 미팅/공유 2회", "크로스팀 협업 1건"],
  },
  curiosity: {
    objective: "호기심으로 학습하고 실무에 적용한다",
    kr: ["심층 질문·리서치 기록 3건", "학습 적용 사례 2건"],
  },
};

/** OKR Draft Agent — aggregates DNA evidence into a next-month OKR card draft. */
export function draftOKRFromEvidence(
  evidence: DNAEvidence[],
  employeeId: string,
  month: string
): OKRCard {
  const counts = new Map<DNAId, number>();
  for (const ev of evidence) {
    counts.set(ev.dnaId, (counts.get(ev.dnaId) ?? 0) + 1);
  }

  const ranked = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const topDna: DNAId[] =
    ranked.length > 0
      ? ranked.slice(0, 2).map(([id]) => id)
      : (["curiosity", "growth_drive"] as DNAId[]);

  const objectives: OKRObjective[] = topDna.map((dnaId) => {
    const template = OKR_TEMPLATES[dnaId];
    return {
      title: template.objective,
      keyResults: template.kr.map((text) => ({ text, progress: 0 })),
      dnaLinked: [dnaId],
    };
  });

  return {
    id: `okr-${employeeId}-${month}-${Math.random().toString(36).slice(2, 7)}`,
    employeeId,
    month,
    objectives,
    status: "draft",
    source: "ai-draft",
    generatedAt: new Date().toISOString(),
  };
}

export type MissionRiskSignals = {
  /** Feedbacks with forHr.riskLevel === "alert" */
  alertCount: number;
  /** Feedbacks with forHr.riskLevel === "watch" */
  watchCount: number;
  /** Assignments past due with progress under 80% */
  overdueLowProgressCount: number;
};

/** Risk Radar Agent — mission delay / low engagement / AI risk signals. */
export function computeRiskNote(
  _employeeId: string,
  _week: number,
  signals: MissionRiskSignals | number
): { level: RiskLevel; reason: string; suggestedAction: string } {
  // Backward-compat: plain number treated as alert-equivalent count.
  const s: MissionRiskSignals =
    typeof signals === "number"
      ? {
          alertCount: signals,
          watchCount: 0,
          overdueLowProgressCount: 0,
        }
      : signals;

  if (s.alertCount >= 1 || s.overdueLowProgressCount >= 2) {
    return {
      level: "alert",
      reason: "미션 지연·저참여 또는 AI 고위험 신호가 감지됐어요.",
      suggestedAction: "이번 주 안에 버디·멘토 1:1 체크인을 잡아보세요.",
    };
  }
  if (s.watchCount >= 1 || s.overdueLowProgressCount === 1) {
    return {
      level: "watch",
      reason: "미션 진행이 더디거나 관찰이 필요한 신호가 있어요.",
      suggestedAction: "다음 미션 체크인에서 회복되는지 가볍게 확인해 주세요.",
    };
  }
  return {
    level: "stable",
    reason: "최근 미션 리스크 신호가 없어요.",
    suggestedAction: "특별한 개입 없이 지금 흐름을 유지해도 좋아요.",
  };
}

/** Review Packet Agent — compiles evidence + OKR history into a conversion-review brief. */
export function generateReviewPacket(
  employee: Employee,
  evidence: DNAEvidence[],
  okrHistory: OKRCard[],
  period: "3개월" | "6개월"
): ReviewPacket {
  const byDna = new Map<DNAId, number>();
  for (const ev of evidence) {
    byDna.set(ev.dnaId, (byDna.get(ev.dnaId) ?? 0) + 1);
  }

  const dnaSummary = Array.from(byDna.entries())
    .map(([dnaId, evidenceCount]) => ({
      dnaId,
      evidenceCount,
      score: Math.min(100, evidenceCount * 25),
    }))
    .sort((a, b) => b.score - a.score);

  const topLabels = dnaSummary
    .slice(0, 2)
    .map((d) => DNA_MAP.get(d.dnaId)?.label)
    .filter(Boolean)
    .join("과 ");

  const growthNote =
    dnaSummary.length > 0
      ? `배치 이후 ${period} 동안 "${topLabels || "여러 핵심가치"}" 관련 행동 근거가 가장 많이 축적됐어요. 스스로 판단하고 팀에 공유하는 패턴이 반복적으로 관찰돼요.`
      : `아직 누적된 핵심가치 근거가 적어요. 다음 기간에는 Decision Simulator와 맞춤 미션·AI 가이드 참여를 늘려보는 걸 권장해요.`;

  const riskNote =
    employee.riskLevel === "alert"
      ? "최근 2주 연속 관찰 신호가 있었어요. 전환심사 전에 1:1 확인을 권장해요."
      : employee.riskLevel === "watch"
      ? "일시적인 어려움 신호가 있었지만 이후 회복하는 흐름을 보였어요."
      : `${period} 동안 특별한 리스크 신호는 없었어요.`;

  const recommendation =
    employee.riskLevel !== "alert" && dnaSummary.length >= 2
      ? `${period} 전환심사 기준 충족 — 데이터상 조기 전환 후보로 검토 가능해요.`
      : "지속 관찰 후 다음 심사 시점에 재평가하는 것을 권장해요.";

  return {
    id: `packet-${employee.id}-${period}-${Date.now()}`,
    employeeId: employee.id,
    period,
    generatedAt: new Date().toISOString(),
    dnaSummary,
    okrHistory,
    growthNote,
    riskNote,
    recommendation,
  };
}

/**
 * AI Buddy — offline stand-in for an LLM with onboarding RAG context
 * (checklist + library + FAQ). Production would stream from an API;
 * the UI still simulates token streaming over this full answer.
 */
export function answerBuddyQuestion(
  question: string,
  context?: {
    checklistSummary?: string;
    employeeName?: string;
  }
): string {
  const faq = matchFAQ(question);
  if (faq.matched) {
    return [
      `좋은 질문이에요${context?.employeeName ? `, ${context.employeeName}님` : ""}.`,
      "",
      faq.answer,
      "",
      context?.checklistSummary
        ? `참고로 현재 온보딩 진행: ${context.checklistSummary}`
        : "더 궁금한 점이 있으면 이어서 물어보세요.",
    ].join("\n");
  }

  const lower = question.toLowerCase();
  const doc = SEED_LIBRARY_DOCS.find((d) =>
    d.keywords.some((k) => lower.includes(k.toLowerCase()) || question.includes(k))
  );
  if (doc) {
    return [
      `관련 자료를 찾았어요: **${doc.title}** (${doc.category})`,
      "",
      doc.summary,
      "",
      `자세한 내용은 자료실에서 확인할 수 있어요. 키워드: ${doc.keywords.join(", ")}.`,
    ].join("\n");
  }

  if (
    ["체크리스트", "진행", "day", "week", "month", "온보딩"].some((k) =>
      lower.includes(k) || question.includes(k)
    )
  ) {
    const stages = ["day1", "week1", "month1"]
      .map((s) => {
        const items = CHECKLIST_ITEMS.filter((i) => i.stage === s);
        return `- **${s}**: ${items.map((i) => i.title).slice(0, 2).join(", ")} 등 ${items.length}항목`;
      })
      .join("\n");
    return [
      "온보딩 체크리스트는 Day 1 / Week 1 / Month 1 단계로 나뉘어 있어요.",
      "",
      stages,
      "",
      context?.checklistSummary
        ? `지금 진행 상황: ${context.checklistSummary}`
        : "일정 & 체크리스트 메뉴에서 바로 체크할 수 있어요.",
    ].join("\n");
  }

  if (["dna", "핵심가치", "가치"].some((k) => lower.includes(k) || question.includes(k))) {
    return [
      "인터엑스 12가지 핵심가치는 암기용이 아니라 **오늘 업무에 필요한 것만** 실천하면 돼요.",
      "",
      "온보딩 여정 > **미션 수행**에서 실천 체크를 하면 중요도 높은 핵심가치 **3가지**와 체크리스트 **3개**만 추천해드려요.",
      "",
      "- 예: `백엔드 API 자동화 스크립트 작성`",
    ].join("\n");
  }

  return [
    `질문을 잘 이해했어요${context?.employeeName ? `, ${context.employeeName}님` : ""}.`,
    "",
    "지금은 데모용 규칙 기반 답변이라 정확한 FAQ/자료 키워드가 있으면 더 구체적으로 안내할 수 있어요.",
    "",
    "이렇게 물어보시면 좋아요:",
    "- 연차는 언제부터 쓸 수 있어요?",
    "- 개발 환경 세팅은 어디서 봐요?",
    "- 체크리스트 Day1에 뭐가 있어요?",
    "- 핵심가치는 어떻게 실천해요?",
    "",
    context?.checklistSummary
      ? `현재 온보딩 요약: ${context.checklistSummary}`
      : "필요하면 커뮤니티 개인 채널로 인사팀에도 익명으로 남길 수 있어요.",
  ].join("\n");
}

/** Split answer into chunks for simulated streaming in the UI. */
export function chunkForStream(text: string, chunkSize = 12): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks.length > 0 ? chunks : [""];
}

export type AnonymizedFeedback = {
  /** Short keyword-centered issue points (never quotes the user). */
  summary: string[];
  /** Actionable resolution strategies for HR. */
  strategies: string[];
  /** Clean delivery body — content only, no meta labels. */
  body: string;
};

/**
 * Anonymous Feedback Agent — summarizes into (1) core points and
 * (2) resolution strategies. NEVER quotes user wording. Output body
 * contains only the content lines (no banner / meta headers).
 */
export function anonymizeFeedback(raw: string): AnonymizedFeedback {
  const text = raw.trim();
  if (!text) {
    return { summary: [], strategies: [], body: "" };
  }

  const themes = detectFeedbackThemes(text);
  const summary =
    themes.length > 0
      ? themes.map((t) => t.summary)
      : ["온보딩 경험 관련 개선 의견"];
  const strategies =
    themes.length > 0
      ? themes.map((t) => t.strategy)
      : ["온보딩 여정 전반에 대한 정기 점검 및 1:1 청취 진행"];

  const body = [...summary, "", ...strategies].join("\n");

  return { summary, strategies, body };
}

type FeedbackTheme = {
  keywords: string[];
  summary: string;
  strategy: string;
};

/** Map meaning to canned summaries only — never echo source phrases. */
function detectFeedbackThemes(text: string): FeedbackTheme[] {
  const themes: FeedbackTheme[] = [];
  const add = (test: RegExp, theme: FeedbackTheme) => {
    if (test.test(text) && !themes.some((t) => t.summary === theme.summary)) {
      themes.push(theme);
    }
  };

  add(/일정|스케줄|촘촘|바쁘|타이트|소화|과다/, {
    keywords: ["온보딩 일정", "밀도", "정리 시간"],
    summary: "온보딩 일정 밀도 완화 및 학습 시간 확보 요청",
    strategy: "주간 일정에 버퍼 타임을 두고, 핵심 세션과 자율 학습 간격을 재배치",
  });
  add(/버디|멘토|1\s*:\s*1|일대일|면담/, {
    keywords: ["버디", "멘토", "정기 면담"],
    summary: "버디·멘토 정기 소통 확대 제안",
    strategy: "버디 1:1 주기를 표준화하고 첫 달 체크인 일정을 캘린더에 사전 고정",
  });
  add(/혼자|외롭|눈치|물어보기|질문하기|묻기\s*어렵/, {
    keywords: ["질의 환경", "심리적 안전"],
    summary: "질문하기 쉬운 업무 환경 조성 필요",
    strategy: "익명·비동기 질문 채널을 안내하고, 팀 스탠드업에 Q&A 슬롯을 짧게 운영",
  });
  add(/힘들|지친|지쳐|번아웃|우울|불안|막막|스트레스/, {
    keywords: ["심리적 부담", "지원"],
    summary: "적응·업무 부담에 대한 지원 점검 필요",
    strategy: "HR·버디 케어 콜을 진행하고, 단기 업무량 조율 여부를 함께 검토",
  });
  add(/복지|연차|휴가|근무\s*시간|야근|워라/, {
    keywords: ["근무", "복지", "안내"],
    summary: "근무·복지 안내 명확화 요청",
    strategy: "복지·근무 FAQ를 온보딩 Day1 자료에 포함하고 담당 창구를 명시",
  });
  add(/개발\s*환경|세팅|계정|권한|툴|슬랙|노션|장비/, {
    keywords: ["업무 환경", "계정", "도구"],
    summary: "업무 환경·계정·도구 세팅 지원 개선 요청",
    strategy: "입사 전 계정 프로비저닝 체크리스트를 강화하고 Day1 IT 지원 슬롯을 확보",
  });
  add(/피드백|리뷰|코드\s*리뷰|평가/, {
    keywords: ["피드백", "리뷰 주기"],
    summary: "피드백·리뷰 주기 및 전달 방식 개선 제안",
    strategy: "주간 피드백 루틴과 기대 수준을 문서화해 신규자에게 사전 공유",
  });
  add(/문화|분위기|소통|회의/, {
    keywords: ["팀 문화", "소통", "회의"],
    summary: "팀 소통·회의 문화의 신규자 참여성 개선 제안",
    strategy: "회의 전 아젠다 공유와 신규 발언 기회를 온보딩 가이드에 반영",
  });
  add(/교육|트레이닝|온보딩\s*자료|문서|가이드/, {
    keywords: ["교육", "온보딩 자료"],
    summary: "온보딩 교육·자료 접근성 개선 요청",
    strategy: "필수 자료를 한 경로로 모아 두고, 주차별 학습 로드맵을 제공",
  });
  add(/좋|감사|고마|도움|만족|응원/, {
    keywords: ["긍정 피드백", "지원 유지"],
    summary: "온보딩 지원에 대한 긍정 의견",
    strategy: "효과가 확인된 지원 방식을 코호트 표준 프로세스로 유지·확산",
  });

  return themes.slice(0, 4);
}
