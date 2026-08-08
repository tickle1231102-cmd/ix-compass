export type GlossaryEntry = {
  term: string;
  definition: string;
  aliases?: string[];
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    term: "IX DNA",
    definition:
      "인터엑스 핵심가치 12가지. 암기보다 오늘 업무에 필요한 3~4개를 실천하는 방식입니다.",
    aliases: ["핵심가치", "DNA"],
  },
  {
    term: "버디",
    definition:
      "온보딩 기간 일상 질문을 편하게 물을 수 있는 동료. 멘토보다 가까운 실무 지원 역할입니다.",
  },
  {
    term: "멘토",
    definition:
      "성장·커리어·업무 방향에 대해 정기적으로 피드백을 주는 선배·리더입니다.",
  },
  {
    term: "OKR",
    definition:
      "Objective and Key Results. 목표와 핵심 결과로 한 달·분기 성과를 정렬합니다.",
  },
  {
    term: "미션",
    definition:
      "집중 온보딩 주간 단위로 배정되는 맞춤 과제. AI 가이드로 수행하고 AI 피드백이 인사팀에 요약됩니다.",
  },
  {
    term: "Context Checklist",
    definition:
      "AI 업무 가이드가 오늘 할 일에 맞는 DNA와 실천 팁을 추천하는 기능의 내부 이름입니다.",
    aliases: ["AI 업무 가이드"],
  },
  {
    term: "Risk Radar",
    definition:
      "미션 지연·저참여·AI 리스크 신호를 바탕으로 코호트 관찰이 필요한 입사자를 표시하는 HR 도구입니다.",
  },
  {
    term: "전환심사",
    definition:
      "배치 3·6개월 시점에 DNA 근거·OKR·리스크를 모아 보는 리뷰 패킷 기반 점검입니다.",
  },
];
