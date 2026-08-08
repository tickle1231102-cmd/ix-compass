import { answerBuddyQuestion } from "@/lib/ai";

export type BuddyAskContext = {
  checklistSummary?: string;
  employeeName?: string;
};

export type BuddyAskResult = {
  reply: string;
  source: "gemini" | "fallback";
};

/**
 * Client helper: ask AI Buddy via the server route, with local rule-engine
 * fallback if the network/API layer fails entirely.
 */
export async function askBuddy(
  message: string,
  context: BuddyAskContext = {}
): Promise<BuddyAskResult> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { reply: "", source: "fallback" };
  }

  try {
    const res = await fetch("/api/ai/buddy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: trimmed,
        employeeName: context.employeeName,
        checklistSummary: context.checklistSummary,
      }),
    });

    if (!res.ok) {
      throw new Error(`buddy api ${res.status}`);
    }

    const data = (await res.json()) as {
      reply?: unknown;
      source?: unknown;
    };

    if (typeof data.reply === "string" && data.reply.trim()) {
      return {
        reply: data.reply,
        source: data.source === "gemini" ? "gemini" : "fallback",
      };
    }

    throw new Error("empty buddy reply");
  } catch {
    return {
      reply: answerBuddyQuestion(trimmed, context),
      source: "fallback",
    };
  }
}
