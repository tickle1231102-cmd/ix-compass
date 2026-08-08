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
