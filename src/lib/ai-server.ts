import type { ActionGuide, DNAId, RiskLevel } from "@/lib/types";
import { ACTION_GUIDES_BY_DNA, DNA_MAP } from "@/lib/seed";

export const ALL_DNA_IDS = Array.from(DNA_MAP.keys()) as DNAId[];

export function isDnaId(value: unknown): value is DNAId {
  return typeof value === "string" && DNA_MAP.has(value as DNAId);
}

export function isRiskLevel(value: unknown): value is RiskLevel {
  return value === "stable" || value === "watch" || value === "alert";
}

export function sanitizeDnaIds(values: unknown, max = 3): DNAId[] {
  if (!Array.isArray(values)) return [];
  const out: DNAId[] = [];
  for (const v of values) {
    if (!isDnaId(v) || out.includes(v)) continue;
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

export function sanitizeStringList(values: unknown, max: number): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .slice(0, max);
}

export function buildGuidesFromDna(
  dnaIds: DNAId[],
  customGuides?: { dnaId?: unknown; text?: unknown }[]
): ActionGuide[] {
  return dnaIds.slice(0, 3).map((dnaId, index) => {
    const custom = customGuides?.find(
      (g) => g.dnaId === dnaId && typeof g.text === "string" && g.text.trim()
    );
    const text =
      (custom?.text as string | undefined)?.trim() ||
      ACTION_GUIDES_BY_DNA.get(dnaId)?.[0]?.text ||
      `${DNA_MAP.get(dnaId)?.shortLabel ?? dnaId} 관련 실천 1건 완료하기`;
    return {
      id: `guide-ai-${dnaId}-${index}`,
      dnaId,
      text,
    };
  });
}

export const PORTAL_TONE = `IX Compass(인터엑스 온보딩 포털) 톤: 친절·구체적·실행 가능. 존댓말, 과장/이모지 남발 금지. 한국어.`;
