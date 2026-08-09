export type BuddyLink = {
  href: string;
  label: string;
};

type BuddyLinkRule = BuddyLink & { keywords: string[] };

/** Portal destinations AI Buddy can deep-link into. */
export const BUDDY_PORTAL_LINKS: BuddyLinkRule[] = [
  {
    href: "/",
    label: "대시보드",
    keywords: ["대시보드", "홈", "오늘 할 일", "다음 할 일"],
  },
  {
    href: "/intro/vision",
    label: "비전 & 핵심가치",
    keywords: ["핵심가치", "dna", "비전", "가치"],
  },
  {
    href: "/intro/culture",
    label: "조직문화",
    keywords: ["조직문화", "문화", "일하는 방식"],
  },
  {
    href: "/intro/guidebook",
    label: "웰컴 가이드북",
    keywords: ["가이드북", "복지", "연차", "휴가", "근무", "식대", "오피스"],
  },
  {
    href: "/journey/missions",
    label: "미션 수행",
    keywords: ["미션", "실천 가이드", "제출", "온보딩 여정"],
  },
  {
    href: "/journey/okr",
    label: "월간 OKR",
    keywords: ["okr", "목표", "키리절트"],
  },
  {
    href: "/journey/timeline",
    label: "캘린더",
    keywords: ["캘린더", "일정", "스케줄", "이벤트"],
  },
  {
    href: "/journey/checklist",
    label: "30-60-90 체크리스트",
    keywords: ["체크리스트", "day1", "week1", "month1", "30-60-90"],
  },
  {
    href: "/org",
    label: "조직도 & 팀 소개",
    keywords: ["조직도", "팀 소개", "조직"],
  },
  {
    href: "/org/buddy",
    label: "멘토 / 버디",
    keywords: ["멘토", "버디", "1:1", "지원망"],
  },
  {
    href: "/org/people",
    label: "동료 프로필",
    keywords: ["동료", "프로필", "연락처", "이메일"],
  },
  {
    href: "/org/community",
    label: "공지 · 팀 채널",
    keywords: ["공지", "커뮤니티", "팀 채널"],
  },
  {
    href: "/resources/tools",
    label: "업무 툴 & 시스템",
    keywords: [
      "자료",
      "자료실",
      "툴",
      "시스템",
      "slack",
      "notion",
      "슬랙",
      "노션",
      "계정",
      "개발환경",
      "세팅",
    ],
  },
  {
    href: "/resources/glossary",
    label: "용어 사전",
    keywords: ["용어", "사전", "약어", "glossary"],
  },
  {
    href: "/resources/faq",
    label: "FAQ · 1:1 문의",
    keywords: ["faq", "자주 묻는", "문의", "질문"],
  },
  {
    href: "/feedback/missions",
    label: "미션 피드백",
    keywords: ["미션 피드백", "ai 피드백", "주간 피드백"],
  },
  {
    href: "/feedback/anonymous",
    label: "익명 피드백",
    keywords: ["익명", "익명화", "피드백 보내"],
  },
];

const LINKS_MARKER_START = "<!--ix-buddy-links:";
const LINKS_MARKER_END = "-->";

export function suggestBuddyLinks(question: string, max = 3): BuddyLink[] {
  const q = question.trim().toLowerCase();
  if (!q) return [];

  const scored = BUDDY_PORTAL_LINKS.map((link) => {
    let score = 0;
    for (const keyword of link.keywords) {
      const k = keyword.toLowerCase();
      if (q.includes(k)) score += k.length >= 3 ? 2 : 1;
    }
    return { href: link.href, label: link.label, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const out: BuddyLink[] = [];
  for (const item of scored) {
    if (out.some((l) => l.href === item.href)) continue;
    out.push({ href: item.href, label: item.label });
    if (out.length >= max) break;
  }
  return out;
}

export function mergeBuddyLinks(...lists: BuddyLink[][]): BuddyLink[] {
  const out: BuddyLink[] = [];
  for (const list of lists) {
    for (const link of list) {
      if (!link.href.startsWith("/")) continue;
      if (out.some((l) => l.href === link.href)) continue;
      out.push({ href: link.href, label: link.label.trim() || link.href });
    }
  }
  return out.slice(0, 4);
}

export function formatBuddyReplyWithLinks(
  reply: string,
  links: BuddyLink[]
): string {
  const clean = reply.replace(/\s+$/, "");
  if (links.length === 0) return clean;
  return `${clean}\n\n${LINKS_MARKER_START}${JSON.stringify(links)}${LINKS_MARKER_END}`;
}

export function parseBuddyContent(content: string): {
  text: string;
  links: BuddyLink[];
} {
  const start = content.indexOf(LINKS_MARKER_START);
  if (start < 0) {
    return {
      text: content,
      links: extractMarkdownPortalLinks(content),
    };
  }
  const jsonStart = start + LINKS_MARKER_START.length;
  const end = content.indexOf(LINKS_MARKER_END, jsonStart);
  if (end < 0) {
    return { text: content, links: extractMarkdownPortalLinks(content) };
  }

  let links: BuddyLink[] = [];
  try {
    const parsed = JSON.parse(content.slice(jsonStart, end)) as unknown;
    if (Array.isArray(parsed)) {
      links = parsed
        .filter(
          (item): item is BuddyLink =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as BuddyLink).href === "string" &&
            typeof (item as BuddyLink).label === "string" &&
            (item as BuddyLink).href.startsWith("/")
        )
        .map((item) => ({
          href: item.href,
          label: item.label.trim() || item.href,
        }));
    }
  } catch {
    links = [];
  }

  const text = `${content.slice(0, start)}${content.slice(end + LINKS_MARKER_END.length)}`
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();

  return {
    text,
    links: mergeBuddyLinks(links, extractMarkdownPortalLinks(text)),
  };
}

function extractMarkdownPortalLinks(text: string): BuddyLink[] {
  const re = /\[([^\]]+)\]\((\/[^\s)]+)\)/g;
  const out: BuddyLink[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const label = match[1]?.trim();
    const href = match[2]?.trim();
    if (!label || !href) continue;
    if (out.some((l) => l.href === href)) continue;
    out.push({ href, label });
  }
  return out;
}

/** Allowed href list for Gemini prompt. */
export function buddyLinksCatalogForPrompt(): string {
  return BUDDY_PORTAL_LINKS.map((l) => `- ${l.label}: ${l.href}`).join("\n");
}
