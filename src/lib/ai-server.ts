import type { ActionGuide, DNAId, RiskLevel } from "@/lib/types";
import { ACTION_GUIDES_BY_DNA, DNA_MAP } from "@/lib/seed";

export const ALL_DNA_IDS = Array.from(DNA_MAP.keys()) as DNAId[];

export function isDnaId(value: unknown): value is DNAId {
  return typeof value === "string" && DNA_MAP.has(value as DNAId);
}

export function isRiskLevel(value: unknown): value is RiskLevel {
  return value === "stable" || value === "watch" || value === "alert";
}

/** Unique DNA ids (for mission focus lists, catalogs). */
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

/**
 * DNA ids in order — duplicates allowed when mission–value fit is strongest
 * on the same value more than once.
 */
export function sanitizeDnaIdsAllowDuplicate(
  values: unknown,
  max = 3
): DNAId[] {
  if (!Array.isArray(values)) return [];
  const out: DNAId[] = [];
  for (const v of values) {
    if (!isDnaId(v)) continue;
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

function libraryTipForDna(dnaId: DNAId, occurrenceIndex: number): string {
  const pool = ACTION_GUIDES_BY_DNA.get(dnaId) ?? [];
  if (pool.length === 0) {
    return `${DNA_MAP.get(dnaId)?.shortLabel ?? dnaId} 관련 실천 1건 완료하기`;
  }
  return pool[occurrenceIndex % pool.length]!.text;
}

/**
 * Build up to 3 practice guides. Same DNA may appear more than once when
 * mission–value fit justifies it; library tips rotate by occurrence.
 */
export function buildGuidesFromDna(
  dnaIds: DNAId[],
  customGuides?: { dnaId?: unknown; text?: unknown }[]
): ActionGuide[] {
  const occurrence = new Map<DNAId, number>();
  const customQueue = Array.isArray(customGuides) ? [...customGuides] : [];

  return dnaIds.slice(0, 3).map((dnaId, index) => {
    const seen = occurrence.get(dnaId) ?? 0;
    occurrence.set(dnaId, seen + 1);

    const customIdx = customQueue.findIndex(
      (g) => g.dnaId === dnaId && typeof g.text === "string" && g.text.trim()
    );
    let text: string | undefined;
    if (customIdx >= 0) {
      text = String(customQueue[customIdx]!.text).trim();
      customQueue.splice(customIdx, 1);
    }
    if (!text) {
      text = libraryTipForDna(dnaId, seen);
    }

    return {
      id: `guide-ai-${dnaId}-${index}-${seen}`,
      dnaId,
      text,
    };
  });
}

/**
 * Prefer model guide rows (order preserved, DNA duplicates OK).
 * Fill remaining slots from fallbackDnaIds (mission-fit candidates).
 */
export function buildPracticeGuides(
  modelGuides: { dnaId?: unknown; text?: unknown }[] | undefined,
  fallbackDnaIds: DNAId[]
): { guides: ActionGuide[]; relevantDnaIds: DNAId[] } {
  const occurrence = new Map<DNAId, number>();
  const guides: ActionGuide[] = [];

  const push = (dnaId: DNAId, text?: string) => {
    if (guides.length >= 3) return;
    const seen = occurrence.get(dnaId) ?? 0;
    occurrence.set(dnaId, seen + 1);
    guides.push({
      id: `guide-ai-${dnaId}-${guides.length}-${seen}`,
      dnaId,
      text: text?.trim() || libraryTipForDna(dnaId, seen),
    });
  };

  for (const g of modelGuides ?? []) {
    if (!isDnaId(g.dnaId)) continue;
    const text =
      typeof g.text === "string" && g.text.trim() ? g.text.trim() : undefined;
    push(g.dnaId, text);
    if (guides.length >= 3) break;
  }

  for (const dnaId of fallbackDnaIds) {
    if (guides.length >= 3) break;
    push(dnaId);
  }

  // Last resort: rotate defaults so we always return 3 actionable tips.
  const defaults: DNAId[] = [
    "curiosity",
    "growth_drive",
    "result_excellence",
  ];
  for (const dnaId of defaults) {
    if (guides.length >= 3) break;
    push(dnaId);
  }

  return {
    guides,
    relevantDnaIds: guides.map((g) => g.dnaId),
  };
}

export const PORTAL_TONE = `IX Compass(인터엑스 온보딩 포털) 톤: 친절·구체적·실행 가능. 존댓말, 과장/이모지 남발 금지. 한국어.`;

/** Core product goal for the practice-guide agent (system prompt). */
export const PRACTICE_GUIDE_GOAL = `핵심 목표: 실행 미션과 인터엑스 핵심가치(DNA)의 실천 맥락 관계성을 분석해, 미션 수행 과정에서 가치를 적용·엮어 내재화하도록 돕는 것이다.
기대효과: 실천 가이드를 통해 가치를 체득하고 최고의 성과로 이어지게 한다.
최우선 순위: '서로 다른 DNA 3개'가 아니라, [미션 ↔ 핵심가치 실천 맥락] 적합성이 가장 높은 가이드 3가지를 고른다.
DNA 중복: 같은 DNA가 미션과 가장 깊게 연결되면 3개 tip에 같은 DNA가 반복되어도 된다. 억지로 다른 DNA를 채우지 않는다.

실천 tip 작성 규칙(필수):
1. 한 주(7일) 안에 끝낼 수 있는 단위 행동만 제안한다. 장기 로드맵·문화 선언·막연한 마음가짐은 금지.
2. 구체적이어야 한다: 대상(누구/무엇), 행동(무엇을 한다), 분량·횟수(예: 2명, 3건, 30분), 산출물(메모·표·메시지·초안 등) 중 2개 이상을 문장에 넣는다.
3. 실행 가능해야 한다: 신입/인턴이 혼자 또는 짧은 요청으로 바로 시작할 수 있고, 완료 여부를 Yes/No로 확인할 수 있어야 한다.
4. 이번 미션 과업에 직접 연결한다. 미션과 무관한 일반 자기계발 tip은 쓰지 않는다.
5. 한 tip = 한 문장(또는 아주 짧은 한 줄). 추상어(열심히, 적극적으로, 깊이 있게, 성장한다)만으로 끝내지 않는다.
6. 예시는 형태만 참고: "AX팀 담당자 2명에게 반복 업무 인터뷰 각 20분 잡아 병목 3건을 표로 정리하기".`;
