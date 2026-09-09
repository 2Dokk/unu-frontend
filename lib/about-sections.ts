export type AboutExampleCategory =
  | "LECTURE"
  | "STUDY"
  | "PROJECT"
  | "MENTORING"
  | "NETWORKING"
  | "DEVELOPMENT_SUPPORT"
  | "COMPETITION_SUPPORT";

export interface AboutSectionInfo {
  id: string;
  slug: string;
  category: AboutExampleCategory;
  groupTitle: "주요 활동" | "지원";
  title: string;
  caseTitle: string;
  description: string;
  watermark: string;
}

export const ACTIVITY_SECTIONS: AboutSectionInfo[] = [
  {
    id: "lectures",
    slug: "lecture",
    category: "LECTURE",
    groupTitle: "주요 활동",
    title: "강의",
    caseTitle: "주요 진행 강의",
    description:
      "웹 개발과 컴퓨터 시스템을 비롯한 다양한 주제의 강의를 진행합니다. \n학회원들이 새로운 기술과 개념을 접하고, 실제 개발에 활용할 수 있는 기반을 쌓을 수 있도록 강의를 구성합니다.",
    watermark: "lecture",
  },
  {
    id: "studies",
    slug: "study",
    category: "STUDY",
    groupTitle: "주요 활동",
    title: "스터디",
    caseTitle: "주요 스터디",
    description:
      "관심 있는 기술과 주제를 중심으로 학회원들이 직접 스터디를 구성하고 운영합니다. \n정기적인 학습과 자료 공유를 통해 함께 지식을 쌓고, 관심 분야를 보다 깊이 탐구할 수 있는 환경을 마련합니다.",
    watermark: "study",
  },
  {
    id: "projects",
    slug: "project",
    category: "PROJECT",
    groupTitle: "주요 활동",
    title: "프로젝트",
    caseTitle: "주요 프로젝트",
    description:
      "아이디어를 실제 서비스로 구현할 수 있도록 팀 프로젝트와 개인 프로젝트를 진행합니다. \n기획부터 개발, 배포까지의 과정을 직접 경험하며 개발 역량을 쌓을 수 있도록 지원합니다.",
    watermark: "project",
  },
  {
    id: "mentoring",
    slug: "mentoring",
    category: "MENTORING",
    groupTitle: "주요 활동",
    title: "멘토링",
    caseTitle: "진행 멘토링",
    description:
      "프로젝트의 기획과 개발 과정에 도움이 될 수 있는 조언과 피드백을 제공합니다. \nSW 마에스트로, 기업 인턴십 등 다양한 대외 개발·커리어 프로그램을 준비하는 학회원들을 위해 관련 경험과 정보도 함께 공유합니다.",
    watermark: "mentoring",
  },
  {
    id: "networking",
    slug: "networking",
    category: "NETWORKING",
    groupTitle: "주요 활동",
    title: "네트워킹",
    caseTitle: "진행 행사",
    description:
      "현업에서 활동하고 있는 선배 개발자와 다양한 분야의 실무자를 만날 수 있는 자리를 마련합니다. \n직무와 진로, 취업 준비 과정과 현업 경험을 직접 나누며 학회원들의 진로 탐색을 지원합니다.\n또한 MT 및 개/종강총회 등 학회원 간 친목 행사를 통해 서로 교류하고 가까워질 수 있는 자리를 마련합니다.",
    watermark: "community",
  },
];

export const SUPPORT_SECTIONS: AboutSectionInfo[] = [
  {
    id: "development-support",
    slug: "development-support",
    category: "DEVELOPMENT_SUPPORT",
    groupTitle: "지원",
    title: "개발 활동 지원",
    caseTitle: "개발 활동 지원 내용",
    description:
      "학회원이 개발 활동에 집중할 수 있도록 필요한 비용을 지원합니다. \n프로젝트 운영, 개발 도구 및 서비스 이용 등 실제 개발 과정에서 발생하는 부담을 줄이고 지속적인 활동을 돕습니다.",
    watermark: "support",
  },
  {
    id: "competitions",
    slug: "competition-support",
    category: "COMPETITION_SUPPORT",
    groupTitle: "지원",
    title: "대회 및 공모전 지원",
    caseTitle: "대회 및 공모전 지원 내용",
    description:
      "대회와 공모전에 도전하는 학회원들의 팀 구성과 참가 활동을 지원합니다. \n대회 및 공모전의 준비와 개발, 참가 과정에서 필요한 비용을 지원하여 학회원들이 외부 무대에서 경험을 쌓을 수 있도록 합니다.",
    watermark: "support",
  },
];

export const ABOUT_INFO_GROUPS = [
  { id: "activity", title: "주요 활동", items: ACTIVITY_SECTIONS },
  { id: "support", title: "지원", items: SUPPORT_SECTIONS },
] as const;

export const ABOUT_SECTIONS = [...ACTIVITY_SECTIONS, ...SUPPORT_SECTIONS];

export function getAboutSection(slug: string) {
  return ABOUT_SECTIONS.find((section) => section.slug === slug);
}
