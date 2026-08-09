import { NextResponse } from "next/server";
import { analyzeTaskContext } from "@/lib/ai";
import {
  ALL_DNA_IDS,
  PORTAL_TONE,
  PRACTICE_GUIDE_GOAL,
  buildPracticeGuides,
  sanitizeDnaIds,
  sanitizeDnaIdsAllowDuplicate,
  sanitizeStringList,
} from "@/lib/ai-server";
import { generateGeminiJson, isGeminiConfigured } from "@/lib/gemini";
import { DNA_MAP } from "@/lib/seed";

export const runtime = "nodejs";

const SYSTEM = `IX Compass 실천 가이드 JSON 에이전트.
${PORTAL_TONE}
${PRACTICE_GUIDE_GOAL}

허용 DNA id: ${ALL_DNA_IDS.join(", ")}
스키마(JSON만):
{
  "relevantDnaIds": ["id","id","id"],
  "matchedKeywords": ["미션에서 읽은 관계 신호"],
  "rationale": "왜 이 3가지 tip이 이번 주 미션 수행·가치 내재화에 적합한지 1~2문장",
  "guides": [
    {"dnaId":"id","text":"한 주 안에 끝낼 구체적 실천 1건(대상·행동·분량·산출물 포함)"},
    {"dnaId":"id","text":"..."},
    {"dnaId":"id","text":"..."}
  ]
}

선정·작성 규칙:
1. 미션 과업을 먼저 이해한 뒤, 각 DNA가 그 미션에서 어떻게 실천·체득되는지 관계성을 평가한다.
2. 적합성이 가장 높은 실천 가이드 3개를 제안한다. 서로 다른 DNA를 채우는 것이 목표가 아니다.
3. 같은 DNA가 미션과 가장 깊게 연결되면 relevantDnaIds/guides에 동일 id가 반복되어도 된다.
4. missionFocusDna는 후보 힌트일 뿐이며, 미션과의 적합성이 낮으면 억지로 넣지 않는다.
5. 각 tip은 이번 주(7일) 내 완료 가능하고, 완료 여부를 바로 확인할 수 있어야 한다.
6. 금지: "호기심을 갖는다", "적극적으로 소통한다", "본질을 파악한다"처럼 측정·검증이 안 되는 문장.
7. 권장 패턴: [대상]에게/에서 [행동]을 [횟수·시간·건수]로 하고 [산출물]을 남기기.`;

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

  const missionFocusDna = sanitizeDnaIds(body.weekFallbackDna, 4);
  const fallback = () => analyzeTaskContext(taskText, missionFocusDna);

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
        `DNA 목록: ${dnaCatalog}`,
        missionFocusDna.length
          ? `missionFocusDna(후보 힌트, 강제 아님): ${missionFocusDna.join(",")}`
          : "missionFocusDna: none",
        `미션/업무:\n${compactTask}`,
        "위 미션과 핵심가치의 실천 맥락 적합성이 가장 높은 가이드 3개를 고르세요. 필요하면 동일 DNA를 반복하세요.",
        "각 tip은 한 주 안에 끝낼 수 있고, 대상·행동·분량·산출물이 드러나는 구체적 실행 문장이어야 합니다.",
      ].join("\n\n"),
      { maxOutputTokens: 700, thinkingBudget: 0, retryOnParseError: false }
    );

    const { guides, relevantDnaIds } = buildPracticeGuides(
      raw.guides,
      // Fill only if model returned fewer than 3 valid guides.
      // Keep duplicate DNA order from the model when present.
      Array.isArray(raw.relevantDnaIds)
        ? sanitizeDnaIdsAllowDuplicate(raw.relevantDnaIds, 6).concat(
            missionFocusDna
          )
        : missionFocusDna
    );

    if (guides.length < 3) {
      return NextResponse.json({
        result: fallback(),
        source: "fallback",
        reason: "invalid_guide_set",
      });
    }

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
