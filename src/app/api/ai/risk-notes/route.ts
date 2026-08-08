import { NextResponse } from "next/server";
import { computeRiskNote, type MissionRiskSignals } from "@/lib/ai";
import { PORTAL_TONE, isRiskLevel } from "@/lib/ai-server";
import { generateGeminiJson, isGeminiConfigured } from "@/lib/gemini";
import type { RiskLevel } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM = `당신은 IX Compass Isolation Risk Radar 코멘트 에이전트입니다.
${PORTAL_TONE}
각 입사자의 미션 리스크 신호를 보고 HR용 reason/suggestedAction을 짧게 작성합니다.
프라이빗 노트·개인 민감정보를 만들어내지 마세요.
스키마:
{
  "notes": [
    {
      "employeeId": "id",
      "level": "stable|watch|alert",
      "reason": "1~2문장",
      "suggestedAction": "개입 제안 1문장"
    }
  ]
}
level은 제공된 규칙엔진 level을 기본으로 유지하세요.`;

type Item = {
  employeeId?: unknown;
  employeeName?: unknown;
  signals?: MissionRiskSignals;
};

type Body = { items?: Item[] };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const items = (Array.isArray(body.items) ? body.items : [])
    .map((item) => {
      const employeeId =
        typeof item.employeeId === "string" ? item.employeeId : "";
      if (!employeeId) return null;
      const signals: MissionRiskSignals = {
        alertCount: Number(item.signals?.alertCount ?? 0) || 0,
        watchCount: Number(item.signals?.watchCount ?? 0) || 0,
        overdueLowProgressCount:
          Number(item.signals?.overdueLowProgressCount ?? 0) || 0,
      };
      const base = computeRiskNote(employeeId, 0, signals);
      return {
        employeeId,
        employeeName:
          typeof item.employeeName === "string" ? item.employeeName : undefined,
        signals,
        base,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x))
    .slice(0, 40);

  const fallbackNotes = () =>
    items.map((item) => ({
      employeeId: item.employeeId,
      note: item.base,
      source: "fallback" as const,
    }));

  if (items.length === 0) {
    return NextResponse.json({ notes: [], source: "fallback" });
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json({
      notes: fallbackNotes(),
      source: "fallback",
      reason: "missing_api_key",
    });
  }

  try {
    const raw = await generateGeminiJson<{
      notes?: {
        employeeId?: unknown;
        level?: unknown;
        reason?: unknown;
        suggestedAction?: unknown;
      }[];
    }>(
      SYSTEM,
      items
        .map(
          (item) =>
            `- id=${item.employeeId}, name=${item.employeeName ?? "?"}, alert=${item.signals.alertCount}, watch=${item.signals.watchCount}, overdue=${item.signals.overdueLowProgressCount}, ruleLevel=${item.base.level}`
        )
        .join("\n"),
      { maxOutputTokens: 900, thinkingBudget: 0 }
    );

    const byId = new Map(
      (raw.notes ?? []).map((n) => [
        typeof n.employeeId === "string" ? n.employeeId : "",
        n,
      ])
    );

    const notes = items.map((item) => {
      const g = byId.get(item.employeeId);
      const level: RiskLevel = isRiskLevel(g?.level) ? g.level : item.base.level;
      const reason =
        typeof g?.reason === "string" && g.reason.trim()
          ? g.reason.trim()
          : item.base.reason;
      const suggestedAction =
        typeof g?.suggestedAction === "string" && g.suggestedAction.trim()
          ? g.suggestedAction.trim()
          : item.base.suggestedAction;
      const usedGemini = Boolean(
        g &&
          ((typeof g.reason === "string" && g.reason.trim()) ||
            (typeof g.suggestedAction === "string" && g.suggestedAction.trim()))
      );
      return {
        employeeId: item.employeeId,
        note: { level, reason, suggestedAction },
        source: usedGemini ? ("gemini" as const) : ("fallback" as const),
      };
    });

    const anyGemini = notes.some((n) => n.source === "gemini");
    return NextResponse.json({
      notes,
      source: anyGemini ? "gemini" : "fallback",
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message.slice(0, 240) : "unknown_error";
    console.error("[risk-notes] gemini_error", detail);
    return NextResponse.json({
      notes: fallbackNotes(),
      source: "fallback",
      reason: "gemini_error",
      detail,
    });
  }
}
