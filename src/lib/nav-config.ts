import type { UserRole } from "./types";

export type NavChild = {
  href: string;
  label: string;
  hint?: string;
  hrOnly?: boolean;
  newhireOnly?: boolean;
  /** Shown under “더보기” in section side nav to reduce primary choice count. */
  secondary?: boolean;
};

export type TopNavItem = {
  href: string;
  label: string;
  children?: NavChild[];
};

/** Top-level IA — 6 domains from menu 구성표. */
export const TOP_NAV: TopNavItem[] = [
  { href: "/", label: "대시보드" },
  {
    href: "/intro",
    label: "소개",
    children: [
      { href: "/intro/vision", label: "비전 & 핵심가치", hint: "철학·DNA" },
      { href: "/intro/culture", label: "조직문화", hint: "일하는 방식" },
      { href: "/intro/guidebook", label: "웰컴 가이드북", hint: "복지·근무·오피스" },
    ],
  },
  {
    href: "/journey",
    label: "온보딩 여정",
    children: [
      {
        href: "/journey/missions",
        label: "미션 수행",
        hint: "가이드·결과물·피드백",
        newhireOnly: true,
      },
      {
        href: "/journey/missions/manage",
        label: "미션 배정",
        hint: "주간 맞춤 배정",
        hrOnly: true,
      },
      {
        href: "/journey/okr",
        label: "월간 OKR",
        hint: "목표·초안",
      },
      {
        href: "/journey/timeline",
        label: "캘린더",
        hint: "일정·이벤트",
        secondary: true,
      },
      {
        href: "/journey/checklist",
        label: "30-60-90 체크리스트",
        hint: "단계별 할 일",
        secondary: true,
      },
    ],
  },
  {
    href: "/org",
    label: "조직 & 담당자",
    children: [
      { href: "/org", label: "조직도 & 팀 소개", hint: "팀·역할" },
      { href: "/org/buddy", label: "멘토 / 버디", hint: "나의 지원망" },
      { href: "/org/people", label: "동료 프로필", hint: "검색·연락" },
      { href: "/org/community", label: "공지 · 팀 채널", hint: "커뮤니티" },
    ],
  },
  {
    href: "/resources",
    label: "자료실",
    children: [
      { href: "/resources/tools", label: "업무 툴 & 시스템", hint: "Slack·Notion 등" },
      { href: "/resources/glossary", label: "용어 사전", hint: "사내 용어" },
      { href: "/resources/faq", label: "FAQ · 1:1 문의", hint: "자주 묻는 질문" },
      { href: "/resources/ai-buddy", label: "AI 버디", hint: "자유 질문" },
    ],
  },
  {
    href: "/feedback",
    label: "피드백",
    children: [
      {
        href: "/feedback/missions",
        label: "미션 피드백",
        hint: "AI 코치 · 미리보기",
        newhireOnly: true,
      },
      {
        href: "/feedback/review",
        label: "진행 리뷰",
        hint: "AI 요약만 확인",
        hrOnly: true,
      },
      {
        href: "/feedback/anonymous",
        label: "익명 피드백",
        hint: "익명화 전송 / 인박스",
      },
      {
        href: "/feedback/risk",
        label: "리스크 레이더",
        hint: "미션 리스크",
        hrOnly: true,
      },
    ],
  },
];

export function filterNavChildren(
  children: NavChild[] | undefined,
  role: UserRole
): NavChild[] {
  if (!children) return [];
  return children.filter((c) => {
    if (c.hrOnly && role !== "hr") return false;
    if (c.newhireOnly && role !== "newhire") return false;
    return true;
  });
}

export function sectionSideNav(
  sectionHref: string,
  role: UserRole
): NavChild[] {
  const item = TOP_NAV.find((t) => t.href === sectionHref);
  return filterNavChildren(item?.children, role);
}

/** Default landing when clicking a top-level section. */
export function sectionDefaultHref(sectionHref: string, role: UserRole): string {
  if (sectionHref === "/") return "/";
  const kids = sectionSideNav(sectionHref, role);
  const primary = kids.find((k) => !k.secondary) ?? kids[0];
  if (primary) return primary.href;
  return sectionHref;
}
