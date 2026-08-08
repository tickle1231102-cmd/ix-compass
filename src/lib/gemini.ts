import { GoogleGenerativeAI } from "@google/generative-ai";

/** gemini-2.0-flash was retired for new traffic; use a current Flash model. */
const DEFAULT_MODEL = "gemini-2.5-flash";

/** Server-only: never import this module from client components. */
export function getGeminiApiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key || undefined;
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export function getGeminiModel(systemInstruction: string) {
  const client = getGeminiClient();
  if (!client) return null;
  return client.getGenerativeModel({
    model: getGeminiModelName(),
    systemInstruction,
  });
}

function extractJsonCandidate(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = (fenced?.[1] ?? trimmed).trim();
  const startObj = raw.indexOf("{");
  const startArr = raw.indexOf("[");
  const start =
    startObj === -1
      ? startArr
      : startArr === -1
        ? startObj
        : Math.min(startObj, startArr);
  if (start < 0) return raw;
  const endObj = raw.lastIndexOf("}");
  const endArr = raw.lastIndexOf("]");
  const end = Math.max(endObj, endArr);
  if (end <= start) return raw;
  return raw.slice(start, end + 1);
}

function repairJsonText(text: string): string {
  return text
    .replace(/^\uFEFF/, "")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, "$1");
}

/** Strip markdown fences and parse the first JSON object/array in model text. */
export function parseJsonFromModelText(text: string): unknown {
  const candidate = extractJsonCandidate(text);
  const attempts = [candidate, repairJsonText(candidate)];
  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return JSON.parse(attempt);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("invalid_json_from_model");
}

type GeminiJsonOptions = {
  maxOutputTokens?: number;
  /**
   * Gemini 2.5 Flash defaults to dynamic thinking (~수 초 지연).
   * Checklist/feedback JSON calls should keep this at 0.
   */
  thinkingBudget?: number;
  /** Skip the expensive second model call on JSON parse failure. */
  retryOnParseError?: boolean;
};

export async function generateGeminiJson<T>(
  systemInstruction: string,
  userPrompt: string,
  options?: GeminiJsonOptions
): Promise<T> {
  const model = getGeminiModel(
    `${systemInstruction}\n\n중요: 응답은 유효한 JSON 한 개만 출력하세요. 문자열 안의 따옴표는 반드시 이스케이프하세요.`
  );
  if (!model) {
    throw new Error("missing_api_key");
  }

  const thinkingBudget = options?.thinkingBudget ?? 0;
  const retryOnParseError = options?.retryOnParseError ?? false;

  const run = async (prompt: string) => {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: options?.maxOutputTokens ?? 1024,
        temperature: 0.3,
        responseMimeType: "application/json",
        // SDK typings lag behind REST `thinkingConfig`.
        thinkingConfig: { thinkingBudget },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    const text = result.response.text()?.trim();
    if (!text) throw new Error("empty_model_response");
    return parseJsonFromModelText(text) as T;
  };

  try {
    return await run(userPrompt);
  } catch (firstError) {
    if (!retryOnParseError) {
      throw firstError instanceof Error
        ? firstError
        : new Error("gemini_json_failed");
    }
    try {
      return await run(
        `${userPrompt}\n\n이전 출력이 JSON 파싱에 실패했습니다. 같은 스키마로 유효한 JSON만 다시 출력하세요.`
      );
    } catch {
      throw firstError instanceof Error
        ? firstError
        : new Error("gemini_json_failed");
    }
  }
}

/** Plain-text generation with thinking disabled for snappy Buddy replies. */
export async function generateGeminiText(
  systemInstruction: string,
  userPrompt: string,
  options?: { maxOutputTokens?: number; thinkingBudget?: number }
): Promise<string> {
  const model = getGeminiModel(systemInstruction);
  if (!model) throw new Error("missing_api_key");
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      maxOutputTokens: options?.maxOutputTokens ?? 1024,
      temperature: 0.7,
      thinkingConfig: { thinkingBudget: options?.thinkingBudget ?? 0 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
  });
  const text = result.response.text()?.trim();
  if (!text) throw new Error("empty_model_response");
  return text;
}
