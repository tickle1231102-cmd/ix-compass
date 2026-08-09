import { NextResponse } from "next/server";
import { anonymizeFeedback, type AnonymizedFeedback } from "@/lib/ai";
import { PORTAL_TONE, sanitizeStringList } from "@/lib/ai-server";
import { generateGeminiJson, isGeminiConfigured } from "@/lib/gemini";

export const runtime = "nodejs";

const SYSTEM = `당신은 IX Compass 익명 피드백 에이전트입니다.
${PORTAL_TONE}

역할: 신규 입사자가 남긴 원문을 HR에게 전달하기 전에 (1) 핵심 이슈 요약과 (2) 해소 전략으로 익명화합니다.

절대 규칙:
1. 원문 문장·표현·고유명사(사람 이름, 팀명 단정, 직함+이름)를 그대로 인용·복붙하지 마세요.
2. 작성자를 특정할 수 있는 표현을 제거하거나 일반화하세요.
3. summary는 키워드 중심의 이슈 포인트(1~4개), strategies는 HR가 바로 실행할 수 있는 해소 전략(1~4개).
4. body는 summary 줄들 + 빈 줄 + strategies 줄들만 포함하세요. 배너/메타 문구 금지.

스키마(JSON만):
{
  "summary": ["이슈 요약1", "이슈 요약2"],
  "strategies": ["해소 전략1", "해소 전략2"],
  "body": "summary줄\\n...\\n\\nstrategies줄\\n..."
}`;

type Body = {
  text?: unknown;
};

function buildBody(summary: string[], strategies: string[]): string {
  return [...summary, "", ...strategies].join("\n").trim();
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  if (text.length > 6000) {
    return NextResponse.json({ error: "text too long" }, { status: 400 });
  }

  const fallback = (): AnonymizedFeedback => anonymizeFeedback(text);

  if (!isGeminiConfigured()) {
    return NextResponse.json({
      result: fallback(),
      source: "fallback",
      reason: "missing_api_key",
    });
  }

  try {
    const compact = text.length > 1200 ? `${text.slice(0, 1200)}…` : text;
    const raw = await generateGeminiJson<{
      summary?: unknown;
      strategies?: unknown;
      body?: unknown;
    }>(
      SYSTEM,
      [
        "아래 원문을 익명화하세요. 원문 표현을 인용하지 마세요.",
        `원문:\n${compact}`,
      ].join("\n\n"),
      { maxOutputTokens: 700, thinkingBudget: 0, retryOnParseError: false }
    );

    const summary = sanitizeStringList(raw.summary, 4);
    const strategies = sanitizeStringList(raw.strategies, 4);
    if (summary.length === 0 || strategies.length === 0) {
      return NextResponse.json({
        result: fallback(),
        source: "fallback",
        reason: "invalid_anonymize_set",
      });
    }

    const bodyText =
      typeof raw.body === "string" && raw.body.trim()
        ? raw.body.trim()
        : buildBody(summary, strategies);

    const result: AnonymizedFeedback = {
      summary,
      strategies,
      body: bodyText,
    };

    return NextResponse.json({
      result,
      source: "gemini",
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message.slice(0, 240) : "unknown_error";
    console.error("[anonymize] gemini_error", detail);
    return NextResponse.json({
      result: fallback(),
      source: "fallback",
      reason: "gemini_error",
      detail,
    });
  }
}
