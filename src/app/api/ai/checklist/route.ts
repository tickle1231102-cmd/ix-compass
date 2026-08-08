import { NextResponse } from "next/server";
import { analyzeTaskContext } from "@/lib/ai";
import {
  ALL_DNA_IDS,
  PORTAL_TONE,
  buildGuidesFromDna,
  sanitizeDnaIds,
  sanitizeStringList,
} from "@/lib/ai-server";
import { generateGeminiJson, isGeminiConfigured } from "@/lib/gemini";
import type { DNAId } from "@/lib/types";
import { DNA_MAP } from "@/lib/seed";

export const runtime = "nodejs";

/** Keep the system prompt short — long instructions + thinking were ~6s. */
const SYSTEM = `IX Compass 실천 가이드 JSON 에이전트.
${PORTAL_TONE}
업무에 맞는 DNA 3개와 tip 3개를 JSON으로만 답하세요.
DNA: ${ALL_DNA_IDS.join(", ")}
스키마: {"relevantDnaIds":["id","id","id"],"matchedKeywords":["k"],"rationale":"1문장","guides":[{"dnaId":"id","text":"오늘 tip 한 문장"}]}
규칙: dna 3개·중복금지, weekFallbackDna 우선, tip은 짧게.`;

type Body = {
  taskText?: unknown;
  weekFallbackDna?: unknown;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const taskText =
    typeof body.taskText === "string" ? body.taskText.trim() : "";
  if (!taskText) {
    return NextResponse.json({ error: "taskText required" }, { status: 400 });
  }
  if (taskText.length > 6000) {
    return NextResponse.json({ error: "taskText too long" }, { status: 400 });
  }

  const weekFallbackDna = sanitizeDnaIds(body.weekFallbackDna, 4);
  const fallback = () => analyzeTaskContext(taskText, weekFallbackDna);

  if (!isGeminiConfigured()) {
    return NextResponse.json({
      result: fallback(),
      source: "fallback",
      reason: "missing_api_key",
    });
  }

  try {
    const dnaCatalog = ALL_DNA_IDS.map(
      (id) => `${id}:${DNA_MAP.get(id)?.shortLabel ?? id}`
    ).join(", ");
    // Truncate long mission paste — model only needs the gist for tip ranking.
    const compactTask =
      taskText.length > 900 ? `${taskText.slice(0, 900)}…` : taskText;

    const raw = await generateGeminiJson<{
      relevantDnaIds?: unknown;
      matchedKeywords?: unknown;
      rationale?: unknown;
      guides?: { dnaId?: unknown; text?: unknown }[];
    }>(
      SYSTEM,
      [
        `DNA: ${dnaCatalog}`,
        weekFallbackDna.length
          ? `focus: ${weekFallbackDna.join(",")}`
          : "focus: none",
        `task: ${compactTask}`,
      ].join("\n"),
      { maxOutputTokens: 512, thinkingBudget: 0, retryOnParseError: false }
    );

    let relevantDnaIds = sanitizeDnaIds(raw.relevantDnaIds, 3);
    for (const id of weekFallbackDna) {
      if (relevantDnaIds.length >= 3) break;
      if (!relevantDnaIds.includes(id)) relevantDnaIds.push(id);
    }
    if (relevantDnaIds.length < 3) {
      const fb = fallback();
      for (const id of fb.relevantDnaIds) {
        if (relevantDnaIds.length >= 3) break;
        if (!relevantDnaIds.includes(id)) relevantDnaIds.push(id);
      }
    }
    relevantDnaIds = relevantDnaIds.slice(0, 3) as DNAId[];
    if (relevantDnaIds.length < 3) {
      return NextResponse.json({
        result: fallback(),
        source: "fallback",
        reason: "invalid_dna_set",
      });
    }

    const guides = buildGuidesFromDna(relevantDnaIds, raw.guides);
    const rationale =
      typeof raw.rationale === "string" && raw.rationale.trim()
        ? raw.rationale.trim()
        : fallback().rationale;

    return NextResponse.json({
      result: {
        relevantDnaIds,
        matchedKeywords: sanitizeStringList(raw.matchedKeywords, 8),
        rationale,
        guides,
      },
      source: "gemini",
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message.slice(0, 240) : "unknown_error";
    console.error("[checklist] gemini_error", detail);
    return NextResponse.json({
      result: fallback(),
      source: "fallback",
      reason: "gemini_error",
      detail,
    });
  }
}
