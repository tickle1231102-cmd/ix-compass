import type {
  DNAValue,
  DNAId,
  DeptTeam,
  Employee,
  MissionTemplate,
  MissionAssignment,
  MissionCheckIn,
  MissionFeedback,
  SimulatorScenario,
  FAQEntry,
  DNAEvidence,
  OKRCard,
  ActionGuide,
  ChecklistItemDef,
  ChecklistProgress,
  ChecklistStage,
  CalendarEvent,
  CommunityPost,
  LibraryDoc,
  OrgMember,
} from "./types";

export const DEMO_EMPLOYEE_ID = "me";

/** New-hire team picker → seed employee profile mapping. */
export const TEAM_OPTIONS: { id: DeptTeam; description: string }[] = [
  { id: "AX팀", description: "AX · AI Transformation" },
  { id: "PM팀", description: "Product Management" },
  { id: "전략팀", description: "Strategy & Planning" },
  { id: "마케팅팀", description: "Brand & Marketing" },
  { id: "HR팀", description: "People Ops (신규 입사)" },
];

export const TEAM_TO_EMPLOYEE_ID: Record<DeptTeam, string> = {
  AX팀: DEMO_EMPLOYEE_ID,
  PM팀: "emp-02",
  전략팀: "emp-03",
  마케팅팀: "emp-04",
  HR팀: "emp-06",
};

export const DNA_VALUES: DNAValue[] = [
  {
    id: "goal_sense",
    label: "선도적/정량 목표의식",
    shortLabel: "정량목표",
    emoji: "🎯",
    description:
      "조직의 목표와 연결된 도전적인 목표를 설정하고, 선행·후행 지표를 수치화하여 목표 달성 과정을 체계적으로 관리합니다.",
  },
  {
    id: "time_mastery",
    label: "초효율적 시간관리",
    shortLabel: "시간관리",
    emoji: "⏰",
    description:
      "AI 등 다양한 도구와 리소스를 적극 활용하여 업무를 자동화/효율화하고, 확보한 시간을 더 높은 가치의 업무에 집중하며 마감기한을 준수합니다.",
  },
  {
    id: "grit",
    label: "집요한 끈기",
    shortLabel: "끈기",
    emoji: "💪",
    description:
      "실패를 통해 빠르게 배우고 전략을 수정하며 반복적으로 실행합니다. 어려운 과제나 불확실한 상황에서도 끝까지 해결책을 찾아냅니다.",
  },
  {
    id: "value_solve",
    label: "가치중심적 문제해결",
    shortLabel: "문제해결",
    emoji: "💡",
    description:
      "고객과 시장에 대한 깊은 이해를 바탕으로 문제의 본질을 파악하고, 단기적인 해결이 아닌 조직 차원의 구조적인 해결방안을 고민합니다.",
  },
  {
    id: "critical_thinking",
    label: "근본적 비판 사고",
    shortLabel: "비판사고",
    emoji: "🧠",
    description:
      "수치와 데이터를 근거로 기존 방식과 경험을 비판적으로 돌아보고, 더 나은 전략과 근본적인 대안을 도출합니다.",
  },
  {
    id: "innovation_accel",
    label: "혁신 프로세스 가속화",
    shortLabel: "혁신가속",
    emoji: "🤖",
    description:
      "AI와 새로운 기술을 적극 활용하여 업무 방식을 개선하고, 더 효율적인 프로세스를 제안하며 동료들과 함께 발전시켜 나갑니다.",
  },
  {
    id: "result_excellence",
    label: "최고수준의 결과지향",
    shortLabel: "결과지향",
    emoji: "🏆",
    description:
      "반복적인 실수를 줄이고 높은 품질을 지속적으로 유지합니다. 맡은 결과물 하나하나에 최고 수준의 완성도와 전문성을 추구합니다.",
  },
  {
    id: "growth_drive",
    label: "자발적 성장동기",
    shortLabel: "성장동기",
    emoji: "📈",
    description:
      "자신의 일의 의미와 가치를 이해하고, 강박적 호기심을 바탕으로 스스로 성장하며 업무를 주도합니다.",
  },
  {
    id: "optimistic_challenge",
    label: "미래낙관적 도전",
    shortLabel: "낙관도전",
    emoji: "🌈",
    description:
      "예상치 못한 변화와 어려움 속에서도 낙천적인 태도를 유지합니다. 더 나은 미래를 믿고 새로운 도전을 이어가며 주변에도 긍정적인 에너지를 전합니다.",
  },
  {
    id: "growth_feedback",
    label: "성장지향 피드백",
    shortLabel: "피드백",
    emoji: "💬",
    description:
      "피드백을 적극적으로 주고받으며, 열린 마음으로 수용하고 감사함을 표현합니다. 이를 통해 함께 성장하는 솔직한 소통 문화를 만들어갑니다.",
  },
  {
    id: "strategic_network",
    label: "관계기반 전략소통",
    shortLabel: "전략소통",
    emoji: "🤝",
    description:
      "내·외부 이해관계자와 신뢰를 바탕으로 전략적 네트워크를 형성하며, 더 큰 시너지를 통한 새로운 기회를 창출합니다.",
  },
  {
    id: "curiosity",
    label: "강박적 호기심",
    shortLabel: "호기심",
    emoji: "🔍",
    description:
      "새로운 분야에도 호기심을 가지고 끊임없이 질문하고 학습하며, 배운 내용을 실무에 적극 적용해 더 나은 방법을 찾아갑니다.",
  },
];

export const DNA_MAP = new Map(DNA_VALUES.map((d) => [d.id, d]));

/**
 * Keyword signals for ranking which of the 12 values matter most to today's
 * task. The AI work guide then keeps only the top 3 as a short checklist.
 */
export const DNA_KEYWORDS: Record<DNAId, string[]> = {
  goal_sense: [
    "목표",
    "okr",
    "kpi",
    "지표",
    "수치",
    "마일스톤",
    "달성",
    "선행",
    "후행",
    "정량",
  ],
  time_mastery: [
    "마감",
    "시간",
    "효율",
    "자동화",
    "스케줄",
    "우선순위",
    "빠르게",
    "단축",
    "캘린더",
  ],
  grit: [
    "실패",
    "재시도",
    "끈기",
    "어려운",
    "막힘",
    "끝까지",
    "반복",
    "불확실",
    "해결",
  ],
  value_solve: [
    "문제",
    "본질",
    "고객",
    "시장",
    "구조",
    "원인",
    "현장",
    "요구사항",
    "페인",
  ],
  critical_thinking: [
    "데이터",
    "분석",
    "비판",
    "근거",
    "가설",
    "검증",
    "리포트",
    "로그",
    "sql",
    "대시보드",
  ],
  innovation_accel: [
    "ai",
    "자동화",
    "프로세스",
    "혁신",
    "개선",
    "툴",
    "도구",
    "워크플로",
    "스크립트",
  ],
  result_excellence: [
    "품질",
    "완성도",
    "산출물",
    "제출",
    "릴리즈",
    "완료",
    "리뷰",
    "완성",
    "디테일",
  ],
  growth_drive: [
    "성장",
    "학습",
    "주도",
    "의미",
    "스스로",
    "오너",
    "담당",
    "스터디",
    "성장동기",
  ],
  optimistic_challenge: [
    "도전",
    "신규",
    "처음",
    "런칭",
    "변화",
    "낙관",
    "스트레치",
    "새로운",
  ],
  growth_feedback: [
    "피드백",
    "코드리뷰",
    "의견",
    "리뷰",
    "소통",
    "전달",
    "감사",
    "수용",
  ],
  strategic_network: [
    "협업",
    "네트워크",
    "이해관계",
    "크로스팀",
    "회의",
    "동료",
    "공유",
    "관계",
    "시너지",
  ],
  curiosity: [
    "호기심",
    "왜",
    "질문",
    "리서치",
    "탐구",
    "배우",
    "조사",
    "디버깅",
    "학습",
  ],
};

/** One primary action tip per DNA — AI work guide picks top 3 DNAs → 3 tips. */
const ACTION_GUIDE_LIBRARY: Record<DNAId, string[]> = {
  goal_sense: [
    "오늘 업무를 조직 목표와 연결해 선행·후행 지표 1개씩 적어보기",
    "이번 주 도전 목표를 수치로 바꿔 팀에 공유하기",
    "목표 대비 현재 진행을 %로 한 줄 점검하기",
  ],
  time_mastery: [
    "반복 업무 1개를 AI·자동화로 줄이고 확보 시간을 기록하기",
    "오늘 할 일 중 고가치 업무를 맨 앞에 두고 마감 시간을 고정하기",
    "마감 전 버퍼 30분을 캘린더에 막아두기",
  ],
  grit: [
    "막힌 지점에서 실패 원인 1개를 적고 다음 시도 계획을 세우기",
    "같은 문제를 다른 전략으로 한 번 더 실행해보기",
    "불확실한 과제의 '다음 최소 실행'을 오늘 안에 끝내기",
  ],
  value_solve: [
    "고객·현장이 겪는 문제로 오늘의 과제를 한 문장 재정의하기",
    "단기 패치가 아닌 구조적 원인 가설을 1개 남기기",
    "해결안이 조직 어디에 영향을 주는지 이해관계자 관점으로 점검하기",
  ],
  critical_thinking: [
    "감이 아닌 수치·로그 근거 1개를 붙여 판단 기록하기",
    "기존 방식이 최선인지 반박 질문 1개를 팀에 던져보기",
    "대안 전략을 데이터로 비교해 한 줄 결론 내기",
  ],
  innovation_accel: [
    "오늘 업무에 AI/새 툴을 1곳 적용해 시간 절감을 재보기",
    "더 나은 프로세스를 동료에게 짧게 제안하기",
    "자동화 가능한 단계를 체크리스트로 분리하기",
  ],
  result_excellence: [
    "제출 전 완성도 체크(오타·엣지케이스·재현) 3항목 점검하기",
    "반복 실수 패턴 1개를 적어 같은 실수 방지 장치 만들기",
    "결과물을 '완료 정의'에 맞춰 한 번 더 다듬어 공유하기",
  ],
  growth_drive: [
    "이 일이 나에게 주는 의미·성장 포인트를 한 줄로 쓰기",
    "오늘 새로 배운 것을 실무에 바로 적용한 사례 남기기",
    "다음으로 주도할 작은 개선 1건을 스스로 잡기",
  ],
  optimistic_challenge: [
    "어려운 변화 앞에서도 가능한 첫 스텝을 낙관적으로 제안하기",
    "주변 동료에게 긍정적 에너지가 되는 한 줄 응원·공유하기",
    "'안 될 것 같다'는 순간에 대안 시나리오 1개를 적기",
  ],
  growth_feedback: [
    "동료에게 구체적 피드백 1건을 오늘 안에 전달하기",
    "받은 피드백에 감사와 반영 계획을 짧게 회신하기",
    "불편하지만 성장에 필요한 의견을 존중을 담아 말하기",
  ],
  strategic_network: [
    "관련 이해관계자 1명에게 맥락을 공유하고 도움을 요청하기",
    "크로스팀 관점을 묻기 위한 짧은 질문 1개를 남기기",
    "협업으로 시너지가 날 지점을 한 줄로 제안하기",
  ],
  curiosity: [
    "'왜?' 질문을 3번 이어가며 원인을 파고든 뒤 결론 남기기",
    "새로운 자료·레퍼런스 1개를 찾아 실무에 적용해보기",
    "모르는 영역을 동료에게 호기심 있게 질문하기",
  ],
};

export const ACTION_GUIDES: ActionGuide[] = Object.entries(
  ACTION_GUIDE_LIBRARY
).flatMap(([dnaId, texts]) =>
  texts.map((text, i) => ({
    id: `guide-${dnaId}-${i}`,
    dnaId: dnaId as DNAId,
    text,
  }))
);

export const ACTION_GUIDES_BY_DNA = new Map<DNAId, ActionGuide[]>(
  Object.keys(ACTION_GUIDE_LIBRARY).map((dnaId) => [
    dnaId as DNAId,
    ACTION_GUIDES.filter((g) => g.dnaId === (dnaId as DNAId)),
  ])
);

/** AX 인턴 온보딩 미션 — 관찰→리서치→설계→검증 루프 */
export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    id: "tpl-w1",
    week: 1,
    title: "부서 업무 관찰·인터뷰로 자동화 기회 찾기",
    description:
      "사내 1개 부서(또는 담당자 2명 이상)를 관찰·인터뷰해 반복 업무·수작업·정보 탐색 병목을 정리하세요. 자동화·AI 에이전트로 줄일 수 있는 기회 3건을 우선순위와 함께 결과물로 제출합니다.",
    dnaFocus: ["curiosity", "value_solve"],
  },
  {
    id: "tpl-w2",
    week: 2,
    title: "AI 도구 리서치·검증으로 활용 가이드 기여",
    description:
      "1주차에서 고른 기회 중 1건에 쓸 최신 AI 도구·솔루션을 리서치하고, 작은 PoC로 적합성을 검증하세요. 전사 AI 활용 가이드라인에 넣을 권장/주의 포인트 초안을 결과물로 제출합니다.",
    dnaFocus: ["innovation_accel", "critical_thinking"],
  },
  {
    id: "tpl-w3",
    week: 3,
    title: "맞춤형 에이전트 기능정의서·와이어프레임",
    description:
      "검증한 자동화 지점에 맞는 부서 맞춤 AI 에이전트(또는 봇)의 기능 정의서와 기초 와이어프레임을 작성하세요. 개발 일정·마일스톤·진척 체크 기준을 함께 붙여 결과물로 제출합니다.",
    dnaFocus: ["goal_sense", "result_excellence"],
  },
  {
    id: "tpl-w4",
    week: 4,
    title: "사용자 테스트로 생산성 임팩트 검증",
    description:
      "대상 부서 사용자 1명 이상과 짧게 테스트해 실제 업무 적용 결과를 검증하세요. 개선 사항·다음 스프린트 액션·예상 생산성 효과를 정리한 회고를 결과물로 제출합니다.",
    dnaFocus: ["growth_feedback", "time_mastery"],
  },
];

/** @deprecated Prefer MISSION_TEMPLATES — alias for week lookups. */
export const MISSIONS = MISSION_TEMPLATES;

export const SCENARIOS: SimulatorScenario[] = [
  {
    id: "s1-anomaly",
    week: 1,
    title: "매뉴얼에 없는 설비 이상 데이터",
    context:
      "고객사 현장 대시보드에 지금까지 본 적 없는 이상 패턴이 감지됐습니다. 사내 매뉴얼에는 대응 절차가 없고, 5분 뒤 고객사와 정기 미팅이 잡혀 있습니다. 당신의 다음 행동은?",
    choices: [
      {
        id: "a",
        label: "일단 로그를 더 파보며 원인 가설을 세워본다",
        dnaId: "curiosity",
        tone: "strong",
        feedback:
          "강박적 호기심 핵심가치가 잘 드러났어요. 정답이 정해지지 않은 상황에서 스스로 파고드는 태도는 인터엑스가 가장 중요하게 보는 행동 중 하나입니다.",
      },
      {
        id: "b",
        label: "선배에게 즉시 보고하고 판단을 맡긴다",
        dnaId: "strategic_network",
        tone: "ok",
        feedback:
          "협업과 에스컬레이션은 좋은 습관이에요. 다만 먼저 짧게라도 스스로 가설을 세운 뒤 공유하면 호기심 핵심가치도 함께 보여줄 수 있어요.",
      },
      {
        id: "c",
        label: "매뉴얼에 없는 케이스니 일단 넘어간다",
        dnaId: "curiosity",
        tone: "risky",
        feedback:
          "이 선택은 위험 신호를 놓칠 수 있어요. 인터엑스 현장에서는 '이상한데?'라는 감각이 문제 해결의 출발점이 됩니다.",
      },
      {
        id: "d",
        label: "정해진 절차대로 이슈 티켓만 등록한다",
        dnaId: "value_solve",
        tone: "ok",
        feedback:
          "절차 준수는 기본이지만, 티켓 등록에서 멈추지 않고 원인을 한 번 더 들여다보면 현장 실행력이 더 강하게 드러날 거예요.",
      },
    ],
  },
  {
    id: "s2-stretch-goal",
    week: 2,
    title: "기술적으로 불가능해 보이는 스프린트 목표",
    context:
      "팀 미팅에서 받은 이번 스프린트 목표가 지금 리소스로는 불가능해 보입니다. 미팅은 5분 뒤 다시 시작됩니다. 당신은 무엇을 이야기하나요?",
    choices: [
      {
        id: "a",
        label: "목표는 유지하되, 첫 마일스톤을 스스로 제안해본다",
        dnaId: "optimistic_challenge",
        tone: "strong",
        feedback:
          "미래낙관적 도전 핵심가치가 잘 드러났어요. 불가능해 보이는 목표 앞에서 먼저 실행 가능한 첫걸음을 제시하는 태도가 인터엑스가 원하는 모습입니다.",
      },
      {
        id: "b",
        label: "목표를 현실적인 수준으로 먼저 축소하자고 제안한다",
        dnaId: "critical_thinking",
        tone: "ok",
        feedback:
          "현실적인 조율도 필요하지만, 축소를 먼저 꺼내기보다 데이터로 리스크를 짚고 대안 경로를 함께 제시하면 더 좋은 인상을 줄 수 있어요.",
      },
      {
        id: "c",
        label: "일단 조용히 있다가 나중에 못했다고 보고한다",
        dnaId: "optimistic_challenge",
        tone: "risky",
        feedback:
          "회피는 신뢰를 떨어뜨릴 수 있어요. 지금 시점에 어렵다는 신호를 솔직하게 공유하는 것 자체가 도전의 시작입니다.",
      },
      {
        id: "d",
        label: "무리해서라도 원래 목표를 그대로 밀어붙이겠다고 한다",
        dnaId: "time_mastery",
        tone: "ok",
        feedback:
          "의지는 좋지만, 근거 없는 밀어붙이기는 번아웃으로 이어질 수 있어요. 빠른 실행은 빠른 검증과 함께 가야 지속 가능합니다.",
      },
    ],
  },
  {
    id: "s3-candid-feedback",
    week: 3,
    title: "발표를 앞둔 동료 코드의 실수",
    context:
      "동료가 오늘 처음으로 결과를 발표하는데, 코드에 명백한 실수가 보입니다. 발표까지 30분 남았습니다. 당신은 어떻게 하나요?",
    choices: [
      {
        id: "a",
        label: "지금 조용히 따로 불러 사실과 대안을 함께 전한다",
        dnaId: "growth_feedback",
        tone: "strong",
        feedback:
          "성장지향 피드백 핵심가치가 잘 드러났어요. 불편할 수 있는 말을 존중을 담아 직접, 그리고 시간 안에 전달한 점이 훌륭합니다.",
      },
      {
        id: "b",
        label: "발표를 망칠까 봐 일단 아무 말도 하지 않는다",
        dnaId: "growth_feedback",
        tone: "risky",
        feedback:
          "침묵은 당장은 편하지만 동료에게도 팀에게도 도움이 되지 않아요. 지금처럼 애매한 순간에 말할 용기가 신뢰를 만듭니다.",
      },
      {
        id: "c",
        label: "발표가 끝난 뒤 다른 동료에게 그 실수에 대해 이야기한다",
        dnaId: "strategic_network",
        tone: "risky",
        feedback:
          "본인에게 직접 전하지 않고 다른 사람에게 먼저 이야기하는 방식은 협업의 신뢰를 갉아먹을 수 있어요. 항상 본인에게 먼저입니다.",
      },
      {
        id: "d",
        label: "발표 중간에 다른 사람들 앞에서 바로 지적한다",
        dnaId: "growth_feedback",
        tone: "ok",
        feedback:
          "솔직함은 좋지만 공개적인 지적은 상대를 방어적으로 만들 수 있어요. 같은 내용이라도 1:1로, 발표 전에 전하는 편이 더 효과적입니다.",
      },
    ],
  },
];

export const FAQS: FAQEntry[] = [
  {
    id: "faq-leave",
    keywords: ["휴가", "연차"],
    answer:
      "연차는 입사 즉시 근로기준법 기준으로 발생하고, 사내 시스템에서 신청 후 팀장 승인으로 확정돼요. 자세한 규정은 그룹웨어 '휴가' 게시판을 참고해주세요.",
  },
  {
    id: "faq-benefit",
    keywords: ["식대", "복지", "포인트", "점심"],
    answer:
      "가산 오피스 기준 중식대와 복지포인트가 매월 지급돼요. 정확한 금액과 사용처는 HR 공지 게시판에서 확인할 수 있어요.",
  },
  {
    id: "faq-overtime",
    keywords: ["야근", "워라밸", "퇴근", "출근"],
    answer:
      "정해진 야근 강제는 없고, 업무량에 따라 자율적으로 조율해요. 다만 마감이 임박하면 매니저와 미리 협의하는 걸 권장해요.",
  },
  {
    id: "faq-okr",
    keywords: ["OKR", "평가", "전환", "심사"],
    answer:
      "매월 OKR 목표카드로 육성·피드백이 진행되고, 3개월·6개월 시점에 단계별 전환심사가 있어요. Growth Compass 페이지의 '이번 달 OKR'에서 확인할 수 있어요.",
  },
  {
    id: "faq-dna",
    keywords: ["핵심가치", "DNA", "인재상"],
    answer:
      "인터엑스는 12가지 핵심가치를 기준으로 성장 방향을 잡아요. 매일 12개를 다 체크할 필요는 없고, AI 업무 가이드가 오늘 할 일에 맞는 가장 중요한 3가지만 체크리스트로 추천해줘요.",
  },
  {
    id: "faq-buddy",
    keywords: ["버디", "멘토", "사수"],
    answer:
      "입사 후 버디(사수)가 배정돼요. 자료실 > 조직 & 담당자에서 내 버디/멘토를 확인할 수 있어요.",
  },
  {
    id: "faq-dresscode",
    keywords: ["복장", "드레스"],
    answer:
      "특별한 드레스코드는 없고 자유로운 복장이 기본이에요. 고객사 방문 시에는 비즈니스 캐주얼을 권장해요.",
  },
  {
    id: "faq-seat",
    keywords: ["자리", "좌석", "사무실"],
    answer:
      "가산 오피스는 자율좌석제로 운영돼요. 입사 첫 주에 총무팀에서 안내드려요.",
  },
];

export const SEED_EMPLOYEES: Employee[] = [
  {
    id: DEMO_EMPLOYEE_ID,
    name: "정예빈",
    dept: "AX팀",
    cohort: "2026년 하반기",
    joinDate: "2026-09-01",
    weekNumber: 3,
    phase: "배치 1개월차",
    riskLevel: "stable",
    isDemoUser: true,
    buddyId: "org-ax-buddy",
    mentorId: "org-ax-mentor",
  },
  {
    id: "emp-02",
    name: "이서연",
    dept: "PM팀",
    cohort: "2026년 하반기",
    joinDate: "2026-09-01",
    weekNumber: 4,
    phase: "배치 1개월차",
    riskLevel: "watch",
    buddyId: "org-pm-buddy",
    mentorId: "org-pm-lead",
  },
  {
    id: "emp-03",
    name: "박현우",
    dept: "전략팀",
    cohort: "2026년 하반기",
    joinDate: "2026-09-01",
    weekNumber: 4,
    phase: "배치 1개월차",
    riskLevel: "stable",
    buddyId: "org-st-buddy",
    mentorId: "org-st-lead",
  },
  {
    id: "emp-04",
    name: "정민아",
    dept: "마케팅팀",
    cohort: "2026년 상반기",
    joinDate: "2026-03-02",
    weekNumber: 12,
    phase: "배치 3개월차",
    riskLevel: "alert",
    buddyId: "org-mkt-buddy",
    mentorId: "org-mkt-lead",
  },
  {
    id: "emp-05",
    name: "최준서",
    dept: "R&D팀",
    cohort: "2026년 상반기",
    joinDate: "2026-03-02",
    weekNumber: 12,
    phase: "배치 3개월차",
    riskLevel: "stable",
  },
  {
    id: "emp-06",
    name: "한소율",
    dept: "HR팀",
    cohort: "2025년 하반기",
    joinDate: "2025-09-01",
    weekNumber: 24,
    phase: "배치 6개월차",
    riskLevel: "stable",
  },
];

export const SEED_MISSION_ASSIGNMENTS: MissionAssignment[] = [
  {
    id: "asg-me-w3",
    employeeId: DEMO_EMPLOYEE_ID,
    templateId: "tpl-w3",
    week: 3,
    title: MISSION_TEMPLATES[2].title,
    description: MISSION_TEMPLATES[2].description,
    dnaFocus: [...MISSION_TEMPLATES[2].dnaFocus],
    dueAt: "2026-08-08T18:00:00.000Z",
    status: "in_progress",
    assignedAt: "2026-08-01T09:00:00.000Z",
    assignedBy: "hr",
    priority: "normal",
  },
  {
    id: "asg-emp02-w2",
    employeeId: "emp-02",
    templateId: "tpl-w2",
    week: 2,
    title: "스프린트 목표를 마일스톤으로 쪼개기",
    description:
      "이번 스프린트에서 불가능해 보이는 목표 1개를 골라 첫 마일스톤·리스크·대안 경로를 정리한 뒤 결과물로 제출하세요.",
    dnaFocus: ["optimistic_challenge", "goal_sense"],
    dueAt: "2026-09-12T18:00:00.000Z",
    status: "awaiting_review",
    assignedAt: "2026-09-05T09:00:00.000Z",
    assignedBy: "hr",
    priority: "normal",
  },
  {
    id: "asg-emp04-w3",
    employeeId: "emp-04",
    templateId: "tpl-w3",
    week: 3,
    title: "브랜드 메시지 피드백 루프",
    description:
      "캠페인 방향이 바뀔 때 동료·매니저에게 피드백을 요청하고 반영 메모를 결과물로 제출하세요.",
    dnaFocus: ["growth_feedback", "strategic_network"],
    dueAt: "2026-05-10T18:00:00.000Z",
    status: "awaiting_review",
    assignedAt: "2026-05-01T09:00:00.000Z",
    assignedBy: "hr",
    priority: "high",
  },
];

export const SEED_MISSION_CHECKINS: MissionCheckIn[] = [
  {
    id: "chk-me-w3-1",
    assignmentId: "asg-me-w3",
    employeeId: DEMO_EMPLOYEE_ID,
    privateNote:
      "기능 범위를 어디까지 1차로 넣을지 고민 중이에요. 인터뷰에서 나온 요청이 많아서요.",
    artifactNote: "기능정의서·와이어프레임 초안",
    attachments: [
      {
        id: "att-me-w3-1",
        name: "HR팀-온보딩FAQ-에이전트-기능정의-초안.txt",
        mimeType: "text/plain",
        size: 520,
        kind: "text",
        textContent:
          "[대상] HR팀 온보딩 FAQ 응답 자동화\n[문제] 반복 FAQ 응대에 주 4시간 소요\n[에이전트 목표] 사내 FAQ·가이드 문서를 근거로 1차 답변 초안 생성\n[핵심 기능] 1) 질문 의도 분류 2) 문서 근거 인용 답변 3) 담당자 에스컬레이션\n[비범위] 연차 승인·급여 계산\n[일정] W1 인터뷰 정리 → W2 PoC → W3 기능정의/WF → W4 사용자 테스트\n[와이어프레임] 입력창 / 근거 카드 / ‘담당자 연결’ CTA",
      },
    ],
    guideSessionIds: [],
    createdAt: "2026-08-04T11:00:00.000Z",
  },
  {
    id: "chk-emp02-w2-1",
    assignmentId: "asg-emp02-w2",
    employeeId: "emp-02",
    privateNote: "목표가 막막했지만 마일스톤으로 나눠보니 한결 나았어요.",
    artifactNote: "마일스톤 초안 Notion",
    attachments: [
      {
        id: "att-emp02-w2-1",
        name: "week2-milestones.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 24576,
        kind: "word",
      },
    ],
    guideSessionIds: [],
    createdAt: "2026-09-11T10:00:00.000Z",
  },
  {
    id: "chk-emp04-w3-1",
    assignmentId: "asg-emp04-w3",
    employeeId: "emp-04",
    privateNote: "방향이 자주 바뀌어 다시 물어보기가 눈치 보여요.",
    guideSessionIds: [],
    createdAt: "2026-05-09T11:00:00.000Z",
  },
];

export const SEED_MISSION_FEEDBACKS: MissionFeedback[] = [
  {
    id: "fb-me-w2",
    assignmentId: "asg-me-w2-done",
    employeeId: DEMO_EMPLOYEE_ID,
    week: 2,
    missionTitle: "현장 페인포인트 리서치 요약",
    forNewhire: {
      coachText:
        "인터뷰·관찰 메모를 구조화해 제출한 점이 좋아요. 다음 주 기능정의에 그대로 이어질 가설을 한 줄로 남겨 두면 흐름이 더 탄탄해집니다.",
      nextActions: [
        "가설 1개를 기능정의서 상단에 옮기기",
        "이해관계자 1명에게 요약본 공유",
      ],
    },
    forHr: {
      summary:
        "2주차 리서치 미션 완료. 결과물·실천 모두 확인되며 3주차 기능정의로 자연스럽게 이어질 상태.",
      progressPct: 100,
      riskLevel: "stable",
      interventionHint: "현 페이스 유지. 주간 피드백으로 격려만 전달하면 됩니다.",
      artifactCount: 1,
      practicedGuideCount: 3,
    },
    generatedAt: "2026-07-31T16:00:00.000Z",
    hrReviewed: true,
    hrWeeklyFeedback:
      "2주차 리서치 정리 잘했어요. 인터뷰에서 나온 ‘반복 FAQ’ 가설을 3주차 기능정의의 첫 문제로 가져가 주세요. 막히면 버디에게 먼저 공유해도 좋습니다.",
    hrDeliveredAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: "fb-emp02-w2",
    assignmentId: "asg-emp02-w2",
    employeeId: "emp-02",
    week: 2,
    missionTitle: "스프린트 목표를 마일스톤으로 쪼개기",
    forNewhire: {
      coachText:
        "마일스톤 결과물을 제출한 점이 훌륭해요. 다음엔 실천 체크를 두 번만 더 하면 이번 주 완주에 더 가까워져요.",
      nextActions: [
        "미션 수행에서 실천 체크 2건 완료",
        "리스크·대안 경로를 한 줄씩 팀에 공유",
      ],
    },
    forHr: {
      summary:
        "2주차 미션 진행 약 50%. 결과물 1건 제출, 도전 목표를 마일스톤으로 분해하는 실행력이 확인됨.",
      progressPct: 50,
      riskLevel: "watch",
      interventionHint: "다음 제출에서 회복되는지 가볍게 지켜봐 주세요.",
      artifactCount: 1,
      practicedGuideCount: 0,
    },
    generatedAt: "2026-09-11T10:05:00.000Z",
    hrReviewed: false,
  },
  {
    id: "fb-emp04-w3",
    assignmentId: "asg-emp04-w3",
    employeeId: "emp-04",
    week: 3,
    missionTitle: "브랜드 메시지 피드백 루프",
    forNewhire: {
      coachText:
        "피드백을 한 번 요청한 것만으로도 큰 진전이에요. 혼자 끌지 말고 버디와 짧은 문장 연습부터 이어가 보세요.",
      nextActions: [
        "버디에게 피드백 문장 초안 리뷰 요청",
        "미션 수행에서 소통·피드백 실천 체크 1건",
      ],
    },
    forHr: {
      summary:
        "3주차 미션 진행 약 0%. 결과물 미제출, 소통·피드백 루프 참여가 낮고 지연 신호가 있음.",
      progressPct: 0,
      riskLevel: "alert",
      interventionHint: "이번 주 안에 버디·멘토 1:1 체크인을 잡아보세요.",
      artifactCount: 0,
      practicedGuideCount: 0,
    },
    generatedAt: "2026-05-09T11:05:00.000Z",
    hrReviewed: false,
  },
];

export const SEED_DNA_EVIDENCE: DNAEvidence[] = [
  {
    id: "ev-emp02-1",
    employeeId: "emp-02",
    dnaId: "curiosity",
    source: "mission",
    sourceLabel: "1주차 미션",
    snippet: "로그를 따라가며 원인 가설을 세운 뒤 팀에 공유",
    week: 1,
    createdAt: "2026-09-05T10:00:00.000Z",
  },
  {
    id: "ev-emp03-1",
    employeeId: "emp-03",
    dnaId: "critical_thinking",
    source: "mission",
    sourceLabel: "2주차 미션",
    snippet: "경쟁사 자료를 수치로 정리해서 팀에 공유",
    week: 2,
    createdAt: "2026-09-11T09:00:00.000Z",
  },
  {
    id: "ev-emp05-1",
    employeeId: "emp-05",
    dnaId: "innovation_accel",
    source: "simulator",
    sourceLabel: "Decision Simulator",
    snippet: "해외 표준 문서를 먼저 확인하고 판단했어요.",
    week: 6,
    createdAt: "2026-04-20T09:00:00.000Z",
  },
];

export const SEED_OKR_CARDS: OKRCard[] = [
  {
    id: "okr-me-08",
    employeeId: DEMO_EMPLOYEE_ID,
    month: "2026-08",
    objectives: [
      {
        title: "AX 인턴으로서 첫 부서 맞춤 자동화 에이전트를 설계한다",
        keyResults: [
          { text: "부서 인터뷰·자동화 기회 맵 1건 제출", progress: 100 },
          { text: "AI 도구 PoC·활용 가이드 초안 1건", progress: 70 },
          { text: "에이전트 기능정의서·와이어프레임 1건", progress: 40 },
        ],
        dnaLinked: ["innovation_accel", "value_solve", "goal_sense"],
      },
    ],
    status: "approved",
    source: "manual",
    generatedAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "okr-emp02-09",
    employeeId: "emp-02",
    month: "2026-09",
    objectives: [
      {
        title: "현장 이슈에 대한 탐구를 습관화한다",
        keyResults: [
          { text: "주간 이상 패턴 로그 3건 이상 스스로 분석", progress: 60 },
          { text: "가설-검증 기록을 미션 체크인에 남기기", progress: 80 },
        ],
        dnaLinked: ["curiosity"],
      },
    ],
    status: "approved",
    source: "ai-draft",
    generatedAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "okr-emp04-05",
    employeeId: "emp-04",
    month: "2026-05",
    objectives: [
      {
        title: "브랜드 메시지의 데이터 기반 검증을 강화한다",
        keyResults: [
          { text: "캠페인별 반응률 데이터 정리 2건", progress: 40 },
          { text: "경쟁사 포지셔닝 비교 리포트 1건", progress: 30 },
        ],
        dnaLinked: ["critical_thinking", "value_solve"],
      },
    ],
    status: "approved",
    source: "manual",
    generatedAt: "2026-05-01T00:00:00.000Z",
  },
];

export const CHECKLIST_STAGE_LABEL: Record<ChecklistStage, string> = {
  day1: "30일 · Day 1",
  week1: "30일 · Week 1",
  month1: "30일 · Month 1",
  day60: "60일",
  day90: "90일",
};

export const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  {
    id: "d1-1",
    stage: "day1",
    title: "입사 서류·계정 수령 확인",
    description: "그룹웨어·슬랙·메일 계정 로그인",
  },
  {
    id: "d1-2",
    stage: "day1",
    title: "보안 서약서 제출",
  },
  {
    id: "d1-3",
    stage: "day1",
    title: "버디와 첫 인사 미팅",
  },
  {
    id: "d1-4",
    stage: "day1",
    title: "사무실·좌석·복지 시설 투어",
  },
  {
    id: "w1-1",
    stage: "week1",
    title: "온보딩 교육 1주차 이수",
  },
  {
    id: "w1-2",
    stage: "week1",
    title: "팀 채널 자기소개 게시",
  },
  {
    id: "w1-3",
    stage: "week1",
    title: "개발/업무 환경 세팅 완료",
  },
  {
    id: "w1-4",
    stage: "week1",
    title: "AI 버디로 FAQ 3개 이상 질문해보기",
  },
  {
    id: "w1-5",
    stage: "week1",
    title: "오늘의 시나리오(의사결정) 1회 완료",
  },
  {
    id: "m1-1",
    stage: "month1",
    title: "첫 달 OKR 초안 작성·공유",
  },
  {
    id: "m1-2",
    stage: "month1",
    title: "멘토 1:1 피드백 미팅",
  },
  {
    id: "m1-3",
    stage: "month1",
    title: "AI 업무 가이드 실천 5건 이상",
  },
  {
    id: "m1-4",
    stage: "month1",
    title: "4주 미션 리뷰 완료",
  },
  {
    id: "d60-1",
    stage: "day60",
    title: "중간 성과 리뷰 미팅 완료",
    description: "60일 점검 — 플레이스홀더 항목",
  },
  {
    id: "d60-2",
    stage: "day60",
    title: "크로스팀 협업 1건 경험",
  },
  {
    id: "d90-1",
    stage: "day90",
    title: "3개월 전환심사 자료 준비",
    description: "90일 점검 — 플레이스홀더 항목",
  },
  {
    id: "d90-2",
    stage: "day90",
    title: "다음 분기 OKR 초안 공유",
  },
];

export const SEED_CHECKLIST_PROGRESS: ChecklistProgress[] = [
  {
    employeeId: DEMO_EMPLOYEE_ID,
    checkedIds: ["d1-1", "d1-2", "d1-3", "d1-4", "w1-1", "w1-2", "w1-3"],
    updatedAt: "2026-09-15T09:00:00.000Z",
  },
  {
    employeeId: "emp-02",
    checkedIds: ["d1-1", "d1-2", "d1-3", "w1-1"],
    updatedAt: "2026-09-10T09:00:00.000Z",
  },
];

export const SEED_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "ev-1",
    title: "온보딩 킥오프",
    date: "2026-08-03",
    time: "10:00",
    type: "education",
    description: "회사 소개 · 핵심가치 · 프로세스 안내",
  },
  {
    id: "ev-2",
    title: "보안·컴플라이언스 교육",
    date: "2026-08-04",
    time: "14:00",
    type: "education",
  },
  {
    id: "ev-3",
    title: "버디 1:1",
    date: "2026-08-05",
    time: "11:00",
    type: "meeting",
    employeeId: DEMO_EMPLOYEE_ID,
  },
  {
    id: "ev-4",
    title: "팀 온보딩 런치",
    date: "2026-08-05",
    time: "12:30",
    type: "social",
  },
  {
    id: "ev-5",
    title: "AX 미션: 에이전트 기능정의 리뷰",
    date: "2026-08-08",
    time: "16:00",
    type: "education",
    employeeId: DEMO_EMPLOYEE_ID,
  },
  {
    id: "ev-6",
    title: "멘토 체크인",
    date: "2026-08-12",
    time: "15:00",
    type: "meeting",
    employeeId: DEMO_EMPLOYEE_ID,
  },
  {
    id: "ev-7",
    title: "월간 OKR 킥오프",
    date: "2026-08-22",
    time: "10:00",
    type: "review",
  },
  {
    id: "ev-8",
    title: "배치 앞둔 중간 점검",
    date: "2026-08-26",
    time: "14:00",
    type: "review",
  },
];

/** Demo "today" aligned with seed calendar for consistent pitch demos. */
export const DEMO_TODAY = "2026-08-05";

export const SEED_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "post-1",
    channel: "board",
    boardCategory: "notice",
    authorId: "emp-06",
    authorName: "한소율",
    title: "9월 온보딩 코호트 환영합니다",
    body: "이번 주 킥오프 자료는 자료실 > 문화 카테고리에 올려두었어요. 궁금한 점은 개인 채널로 편하게 남겨주세요!",
    anonymous: false,
    createdAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "post-2",
    channel: "board",
    boardCategory: "notice",
    authorId: "hr",
    authorName: "인사팀",
    title: "가산 오피스 주차·출입 안내",
    body: "신규입사자 출입카드는 Day 1 오전 HR 데스크에서 수령해 주세요. 주차권은 버디에게 요청하시면 됩니다.",
    anonymous: false,
    createdAt: "2026-09-02T09:00:00.000Z",
  },
  {
    id: "post-3",
    channel: "team",
    authorId: DEMO_EMPLOYEE_ID,
    authorName: "정예빈",
    team: "AX팀",
    title: "AX팀 자기소개",
    body: "안녕하세요, AX 인턴 정예빈입니다. 부서별 맞춤 AI 에이전트·자동화 설계에 관심 많아요. 인터뷰·테스트에 불러주시면 감사하겠습니다!",
    anonymous: false,
    createdAt: "2026-09-02T09:00:00.000Z",
  },
  {
    id: "post-4",
    channel: "team",
    authorId: "org-ax-buddy",
    authorName: "오세진",
    team: "AX팀",
    body: "환영해요 예빈님! 막히는 거 있으면 슬랙이나 여기로 바로 불러주세요.",
    anonymous: false,
    createdAt: "2026-09-02T09:30:00.000Z",
  },
  {
    id: "post-5",
    channel: "personal",
    authorId: "emp-02",
    authorName: "이서연",
    peerEmployeeId: "emp-02",
    body: "스프린트 목표가 조금 막막한데, 주간 미팅에서 어떻게 말하면 좋을까요?",
    anonymous: false,
    createdAt: "2026-09-11T10:00:00.000Z",
  },
  {
    id: "post-6",
    channel: "personal",
    authorId: "hr",
    authorName: "인사팀",
    peerEmployeeId: "emp-02",
    body: "괜찮아요. 막막함을 솔직히 공유하는 것 자체가 좋은 신호예요. 버디와 마일스톤을 나눠보는 걸 권장합니다.",
    anonymous: false,
    createdAt: "2026-09-11T11:00:00.000Z",
  },
  {
    id: "post-anon-1",
    channel: "personal",
    authorId: DEMO_EMPLOYEE_ID,
    authorName: "익명",
    peerEmployeeId: DEMO_EMPLOYEE_ID,
    title: "익명 피드백",
    body: "온보딩 일정 밀도 완화 및 학습 시간 확보 요청\n버디·멘토 정기 소통 확대 제안\n\n주간 일정에 버퍼 타임을 두고, 핵심 세션과 자율 학습 간격을 재배치\n버디 1:1 주기를 표준화하고 첫 달 체크인 일정을 캘린더에 사전 고정",
    anonymous: true,
    createdAt: "2026-08-04T15:20:00.000Z",
  },
];

export const SEED_LIBRARY_DOCS: LibraryDoc[] = [
  {
    id: "lib-1",
    category: "인사/복리후생",
    title: "연차·휴가 신청 가이드",
    summary: "연차 발생 기준과 그룹웨어 신청 절차",
    url: "https://interxlab.com",
    keywords: ["연차", "휴가", "복지"],
  },
  {
    id: "lib-2",
    category: "인사/복리후생",
    title: "복지포인트·식대 안내",
    summary: "월별 지급 항목과 사용처",
    url: "https://interxlab.com",
    keywords: ["식대", "복지", "포인트"],
  },
  {
    id: "lib-3",
    category: "보안",
    title: "정보보안 수칙",
    summary: "계정·기기·데이터 취급 기본 원칙",
    url: "https://interxlab.com",
    keywords: ["보안", "서약", "계정"],
  },
  {
    id: "lib-4",
    category: "개발환경",
    title: "로컬 개발 환경 세팅",
    summary: "필수 도구, VPN, 저장소 접근",
    url: "https://interxlab.com",
    keywords: ["개발", "세팅", "환경", "git"],
  },
  {
    id: "lib-5",
    category: "개발환경",
    title: "배포·리뷰 프로세스",
    summary: "PR 규칙과 스테이지 배포 흐름",
    url: "https://interxlab.com",
    keywords: ["배포", "PR", "리뷰"],
  },
  {
    id: "lib-6",
    category: "문화",
    title: "핵심가치 12가지 해설",
    summary: "핵심가치를 현장 행동으로 옮기는 가이드",
    url: "https://interxlab.com",
    keywords: ["핵심가치", "문화", "인재상"],
  },
  {
    id: "lib-7",
    category: "문화",
    title: "회의·피드백 문화",
    summary: "솔직한 피드백과 회의 운영 팁",
    url: "https://interxlab.com",
    keywords: ["피드백", "회의", "문화"],
  },
  {
    id: "lib-8",
    category: "제품/도메인",
    title: "제조 AI 제품 개요",
    summary: "인터엑스 주요 제품 라인과 고객 현장",
    url: "https://interxlab.com",
    keywords: ["제품", "제조", "AI", "도메인"],
  },
];

export const SEED_ORG_MEMBERS: OrgMember[] = [
  {
    id: "org-ax-buddy",
    name: "오세진",
    team: "AX팀",
    role: "AX 엔지니어 · 버디",
    email: "sejin.oh@interxlab.com",
    bio: "부서별 AI 에이전트·자동화 봇을 만들고, 신규 동료 온보딩을 도와요.",
  },
  {
    id: "org-ax-mentor",
    name: "윤하늘",
    team: "AX팀",
    role: "AX 리드 · 멘토",
    email: "haneul.yoon@interxlab.com",
    bio: "전사 AI 활용 가이드와 에이전트 로드맵을 이끌고 있어요.",
  },
  {
    id: "org-ax-2",
    name: "정예빈",
    team: "AX팀",
    role: "AX 인턴",
    email: "yebin.jung@interxlab.com",
    bio: "2026 하반기 입사 · AI Transformation",
  },
  {
    id: "org-pm-buddy",
    name: "배수아",
    team: "PM팀",
    role: "PM · 버디",
    email: "sua.bae@interxlab.com",
    bio: "고객 여정과 로드맵을 정리합니다.",
  },
  {
    id: "org-pm-lead",
    name: "정우진",
    team: "PM팀",
    role: "PM 리드 · 멘토",
    email: "woojin.jung@interxlab.com",
    bio: "제품 우선순위를 데이터로 설득하는 편이에요.",
  },
  {
    id: "org-st-buddy",
    name: "한가은",
    team: "전략팀",
    role: "전략 · 버디",
    email: "gaeun.han@interxlab.com",
    bio: "시장·경쟁 분석을 담당합니다.",
  },
  {
    id: "org-st-lead",
    name: "송민호",
    team: "전략팀",
    role: "전략 리드 · 멘토",
    email: "minho.song@interxlab.com",
    bio: "중장기 성장 시나리오를 만듭니다.",
  },
  {
    id: "org-mkt-buddy",
    name: "이채원",
    team: "마케팅팀",
    role: "마케팅 · 버디",
    email: "chaewon.lee@interxlab.com",
    bio: "브랜드 메시지와 캠페인을 함께 만들어요.",
  },
  {
    id: "org-mkt-lead",
    name: "박지후",
    team: "마케팅팀",
    role: "마케팅 리드 · 멘토",
    email: "jihoo.park@interxlab.com",
    bio: "B2B 스토리텔링이 전문 분야입니다.",
  },
  {
    id: "org-hr-1",
    name: "한소율",
    team: "HR팀",
    role: "People Ops",
    email: "soyul.han@interxlab.com",
    bio: "온보딩·전환심사·조직문화를 담당합니다.",
  },
  {
    id: "org-hr-2",
    name: "노지민",
    team: "HR팀",
    role: "HRBP",
    email: "jimin.noh@interxlab.com",
    bio: "팀별 육성 프로그램과 1:1을 지원해요.",
  },
];

export const LIBRARY_CATEGORIES = [
  "인사/복리후생",
  "보안",
  "개발환경",
  "문화",
  "제품/도메인",
] as const;
