import { NextResponse } from "next/server";
import { draftOKRFromEvidence } from "@/lib/ai";
import {
  ALL_DNA_IDS,
  PORTAL_TONE,
  isDnaId,
  sanitizeDnaIds,
  sanitizeStringList,
} from "@/lib/ai-server";
import { generateGeminiJson, isGeminiConfigured } from "@/lib/gemini";
import type { DNAEvidence, DNAId, OKRCard, OKRObjective } from "@/lib/types";
import { DNA_MAP } from "@/lib/seed";

export const runtime = "nodejs";

const SYSTEM = `당신은 IX Compass OKR 초안 에이전트입니다.
${PORTAL_TONE}
누적 DNA 근거를 보고 다음 달 Objective 1~2개와 각 Objective의 Key Result 2개를 JSON으로 만듭니다.
스키마:
{
  "objectives": [
    {
      "title": "Objective 문장",
      "keyResults": ["KR1", "KR2"],
      "dnaLinked": ["dna_id"]
    }
  ]
}
허용 DNA: ${ALL_DNA_IDS.join(", ")}
규칙: 측정 가능한 KR, 과장 금지, 온보딩/실무 성장에 맞게.`;

type Body = {
  evidence?: DNAEvidence[];
  employeeId?: unknown;
  employeeName?: unknown;
  month?: unknown;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const employeeId =
    typeof body.employeeId === "string" ? body.employeeId.trim() : "";
  const month = typeof body.month === "string" ? body.month.trim() : "";
  const evidence = Array.isArray(body.evidence) ? body.evidence : [];
  if (!employeeId || !month) {
    return NextResponse.json(
      { error: "employeeId and month required" },
      { status: 400 }
    );
  }

  const fallback = () => draftOKRFromEvidence(evidence, employeeId, month);

  if (!isGeminiConfigured()) {
    return NextResponse.json({
      draft: fallback(),
      source: "fallback",
      reason: "missing_api_key",
    });
  }

  try {
    const evidenceLines = evidence
      .slice(0, 24)
      .map(
        (e) =>
          `- ${e.dnaId} (${DNA_MAP.get(e.dnaId)?.shortLabel}): ${e.snippet}`
      )
      .join("\n");

    const raw = await generateGeminiJson<{
      objectives?: {
        title?: unknown;
        keyResults?: unknown;
        dnaLinked?: unknown;
      }[];
    }>(
      SYSTEM,
      [
        `입사자: ${typeof body.employeeName === "string" ? body.employeeName : employeeId}`,
        `대상 월: ${month}`,
        `DNA 근거:\n${evidenceLines || "(근거 없음 — 성장·호기심 기본 제안)"}`,
      ].join("\n\n"),
      { maxOutputTokens: 700, thinkingBudget: 0 }
    );

    const objectives: OKRObjective[] = [];
    for (const obj of raw.objectives ?? []) {
      if (typeof obj.title !== "string" || !obj.title.trim()) continue;
      const keyResults = sanitizeStringList(obj.keyResults, 3);
      if (keyResults.length < 1) continue;
      let dnaLinked = sanitizeDnaIds(obj.dnaLinked, 2);
      if (dnaLinked.length === 0) {
        const first = Array.isArray(obj.dnaLinked) ? obj.dnaLinked[0] : null;
        if (isDnaId(first)) dnaLinked = [first];
      }
      if (dnaLinked.length === 0) dnaLinked = ["curiosity" as DNAId];
      objectives.push({
        title: obj.title.trim(),
        keyResults: keyResults.slice(0, 2).map((text) => ({ text, progress: 0 })),
        dnaLinked,
      });
      if (objectives.length >= 2) break;
    }

    if (objectives.length === 0) {
      return NextResponse.json({
        draft: fallback(),
        source: "fallback",
        reason: "invalid_objectives",
      });
    }

    const draft: OKRCard = {
      id: `okr-${employeeId}-${month}-${Math.random().toString(36).slice(2, 7)}`,
      employeeId,
      month,
      objectives,
      status: "draft",
      source: "ai-draft",
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ draft, source: "gemini" });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message.slice(0, 240) : "unknown_error";
    console.error("[okr-draft] gemini_error", detail);
    return NextResponse.json({
      draft: fallback(),
      source: "fallback",
      reason: "gemini_error",
      detail,
    });
  }
}
