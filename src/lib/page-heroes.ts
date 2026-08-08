export type PageHeroConfig = {
  /** Large center title (often English, like USE CASE) */
  title: string;
  image: string;
  alt: string;
  /** Left pill — section name */
  sectionLabel: string;
  /** Right pill — current tab (optional) */
  tabLabel?: string;
};

type SectionDefault = {
  sectionLabel: string;
  title: string;
  image: string;
  alt: string;
};

const SECTION_DEFAULTS: Record<string, SectionDefault> = {
  "/intro": {
    sectionLabel: "소개",
    title: "INTRODUCTION",
    image: "/heroes/intro.jpg",
    alt: "제조·산업 현장의 기술 환경",
  },
  "/journey": {
    sectionLabel: "온보딩 여정",
    title: "ONBOARDING",
    image: "/heroes/journey.jpg",
    alt: "목표를 세우고 업무를 진행하는 모습",
  },
  "/org": {
    sectionLabel: "조직 & 담당자",
    title: "ORGANIZATION",
    image: "/heroes/org.jpg",
    alt: "함께 일하는 오피스·조직 공간",
  },
  "/resources": {
    sectionLabel: "자료실",
    title: "RESOURCES",
    image: "/heroes/resources.jpg",
    alt: "협업 도구와 지식 공유 환경",
  },
  "/feedback": {
    sectionLabel: "피드백",
    title: "FEEDBACK",
    image: "/heroes/feedback.jpg",
    alt: "팀 피드백과 성장 대화",
  },
};

/** Exact or prefix pathname overrides for key tabs */
const PATH_OVERRIDES: { match: string | RegExp; config: Partial<PageHeroConfig> & { title: string; image?: string; alt?: string; tabLabel?: string } }[] = [
  {
    match: "/intro/vision",
    config: {
      title: "VISION",
      tabLabel: "비전 & 핵심가치",
      image: "/heroes/vision.jpg",
      alt: "기술과 혁신을 상징하는 회로·산업 이미지",
    },
  },
  {
    match: "/intro/culture",
    config: {
      title: "CULTURE",
      tabLabel: "조직문화",
      image: "/heroes/culture.jpg",
      alt: "동료와 함께 협업하는 팀",
    },
  },
  {
    match: "/intro/guidebook",
    config: {
      title: "GUIDEBOOK",
      tabLabel: "웰컴 가이드북",
    },
  },
  {
    match: "/journey/missions/manage",
    config: {
      title: "ASSIGN",
      tabLabel: "미션 배정",
      image: "/heroes/missions.jpg",
      alt: "미션을 기획·배정하는 업무 장면",
    },
  },
  {
    match: /^\/journey\/missions/,
    config: {
      title: "MISSION",
      tabLabel: "미션 수행",
      image: "/heroes/missions.jpg",
      alt: "소프트웨어·에이전트를 설계하는 업무 장면",
    },
  },
  {
    match: "/journey/okr",
    config: {
      title: "OKR",
      tabLabel: "월간 OKR",
    },
  },
  {
    match: "/journey/timeline",
    config: {
      title: "CALENDAR",
      tabLabel: "캘린더",
    },
  },
  {
    match: "/journey/checklist",
    config: {
      title: "CHECKLIST",
      tabLabel: "30-60-90 체크리스트",
    },
  },
  {
    match: "/org/buddy",
    config: {
      title: "BUDDY",
      tabLabel: "멘토 / 버디",
      image: "/heroes/culture.jpg",
      alt: "멘토링·버디 관계의 협업 장면",
    },
  },
  {
    match: "/org/people",
    config: {
      title: "PEOPLE",
      tabLabel: "동료 프로필",
    },
  },
  {
    match: "/org/community",
    config: {
      title: "COMMUNITY",
      tabLabel: "공지 · 팀 채널",
    },
  },
  {
    match: "/resources/tools",
    config: {
      title: "TOOLS",
      tabLabel: "업무 툴 & 시스템",
    },
  },
  {
    match: "/resources/glossary",
    config: {
      title: "GLOSSARY",
      tabLabel: "용어 사전",
    },
  },
  {
    match: "/resources/faq",
    config: {
      title: "FAQ",
      tabLabel: "FAQ · 1:1 문의",
    },
  },
  {
    match: /^\/resources\/ai-buddy/,
    config: {
      title: "AI BUDDY",
      tabLabel: "AI 버디",
    },
  },
  {
    match: "/feedback/missions",
    config: {
      title: "MISSION FEEDBACK",
      tabLabel: "미션 피드백",
    },
  },
  {
    match: "/feedback/review",
    config: {
      title: "REVIEW",
      tabLabel: "진행 리뷰",
    },
  },
  {
    match: "/feedback/anonymous",
    config: {
      title: "ANONYMOUS",
      tabLabel: "익명 피드백",
    },
  },
  {
    match: "/feedback/risk",
    config: {
      title: "RISK RADAR",
      tabLabel: "리스크 레이더",
    },
  },
];

function sectionKeyFromHref(sectionHref: string): string {
  if (sectionHref.startsWith("/intro")) return "/intro";
  if (sectionHref.startsWith("/journey")) return "/journey";
  if (sectionHref.startsWith("/org")) return "/org";
  if (sectionHref.startsWith("/resources")) return "/resources";
  if (sectionHref.startsWith("/feedback")) return "/feedback";
  return sectionHref;
}

function findOverride(pathname: string) {
  for (const row of PATH_OVERRIDES) {
    if (typeof row.match === "string") {
      if (pathname === row.match || pathname.startsWith(`${row.match}/`)) {
        return row.config;
      }
    } else if (row.match.test(pathname)) {
      return row.config;
    }
  }
  return null;
}

/** Resolve hero for a section page from section root + current pathname. */
export function resolvePageHero(
  sectionHref: string,
  pathname: string
): PageHeroConfig | null {
  const key = sectionKeyFromHref(sectionHref);
  const base = SECTION_DEFAULTS[key];
  if (!base) return null;

  const override = findOverride(pathname);

  let tabLabel = override?.tabLabel;
  if (!tabLabel && key === "/org" && (pathname === "/org" || pathname === "/org/")) {
    tabLabel = "조직도 & 팀 소개";
  }

  return {
    sectionLabel: override?.sectionLabel ?? base.sectionLabel,
    title: override?.title ?? base.title,
    image: override?.image ?? base.image,
    alt: override?.alt ?? base.alt,
    tabLabel,
  };
}
