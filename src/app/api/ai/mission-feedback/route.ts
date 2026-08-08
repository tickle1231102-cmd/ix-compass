import { NextResponse } from "next/server";
import { generateMissionFeedback } from "@/lib/ai";
import {
  PORTAL_TONE,
  isRiskLevel,
  sanitizeDnaIds,
  sanitizeStringList,
} from "@/lib/ai-server";
import { generateGeminiJson, isGeminiConfigured } from "@/lib/gemini";
import type {
  ContextChecklist,
  MissionAssignment,
  MissionCheckIn,
  RiskLevel,
} from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM = `당신은 IX Compass 미션 AI 피드백 에이전트입니다.
${PORTAL_TONE}
신입용 코칭과 HR용 요약(이중 채널)을 JSON으로 작성합니다.
프라이빗 노트·결과물 원문을 HR summary에 그대로 인용하지 마세요.
스키마:
{
  "forNewhire": { "coachText": "2~4문장", "nextActions": ["행동1","행동2","행동3"] },
  "forHr": { "summary": "진행 요약(원문 인용 금지)", "riskLevel": "stable|watch|alert", "interventionHint": "개입 힌트 1문장" },
  "dnaTags": ["dna_id"]
}`;

type Body = {
  assignment?: MissionAssignment;
  checkIns?: MissionCheckIn[];
  guides?: ContextChecklist[];
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const assignment = body.assignment;
  const checkIns = Array.isArray(body.checkIns) ? body.checkIns : [];
  const guides = Array.isArray(body.guides) ? body.guides : [];
  if (!assignment?.id || !assignment.title) {
    return NextResponse.json({ error: "assignment required" }, { status: 400 });
  }

  const fallback = () =>
    generateMissionFeedback(assignment, checkIns, guides);

  if (!isGeminiConfigured()) {
    return NextResponse.json({
      result: fallback(),
      source: "fallback",
      reason: "missing_api_key",
    });
  }

  try {
    const base = fallback();
    const attachmentNames = checkIns
      .flatMap((c) => c.attachments ?? [])
      .map((a) => a.name)
      .slice(0, 5);
    const textPreview = checkIns
      .flatMap((c) => c.attachments ?? [])
      .filter((a) => a.kind === "text" && a.textContent)
      .map((a) => a.textContent!.slice(0, 400))
      .join("\n")
      .slice(0, 800);
    const privateHint = checkIns.some((c) => c.privateNote?.trim())
      ? "프라이빗 노트 있음(원문 비공개, 톤만 반영)"
      : "프라이빗 노트 없음";

    const raw = await generateGeminiJson<{
      forNewhire?: { coachText?: unknown; nextActions?: unknown };
      forHr?: {
        summary?: unknown;
        riskLevel?: unknown;
        interventionHint?: unknown;
      };
      dnaTags?: unknown;
    }>(
      SYSTEM,
      [
        `미션: ${assignment.week}주차 「${assignment.title}」`,
        `설명: ${assignment.description}`,
        `DNA focus: ${assignment.dnaFocus.join(", ")}`,
        `마감: ${assignment.dueAt}`,
        `규칙엔진 진행률: ${base.forHr.progressPct}%`,
        `결과물 수: ${base.forHr.artifactCount} · 파일: ${attachmentNames.join(", ") || "없음"}`,
        `가이드 실천: ${base.forHr.practicedGuideCount}`,
        `규칙엔진 리스크: ${base.forHr.riskLevel}`,
        privateHint,
        textPreview ? `결과물 텍스트 미리보기(신입 채널용):\n${textPreview}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      { maxOutputTokens: 700, thinkingBudget: 0 }
    );

    const coachText =
      typeof raw.forNewhire?.coachText === "string" &&
      raw.forNewhire.coachText.trim()
        ? raw.forNewhire.coachText.trim()
        : base.forNewhire.coachText;
    const nextActions = sanitizeStringList(raw.forNewhire?.nextActions, 3);
    const summary =
      typeof raw.forHr?.summary === "string" && raw.forHr.summary.trim()
        ? raw.forHr.summary.trim()
        : base.forHr.summary;
    const interventionHint =
      typeof raw.forHr?.interventionHint === "string" &&
      raw.forHr.interventionHint.trim()
        ? raw.forHr.interventionHint.trim()
        : base.forHr.interventionHint;
    const riskLevel: RiskLevel = isRiskLevel(raw.forHr?.riskLevel)
      ? raw.forHr.riskLevel
      : base.forHr.riskLevel;

    return NextResponse.json({
      result: {
        forNewhire: {
          coachText,
          nextActions:
            nextActions.length > 0 ? nextActions : base.forNewhire.nextActions,
        },
        forHr: {
          ...base.forHr,
          summary,
          interventionHint,
          riskLevel,
        },
        dnaTags: sanitizeDnaIds(raw.dnaTags, 2),
      },
      source: "gemini",
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message.slice(0, 240) : "unknown_error";
    console.error("[mission-feedback] gemini_error", detail);
    return NextResponse.json({
      result: fallback(),
      source: "fallback",
      reason: "gemini_error",
      detail,
    });
  }
}
