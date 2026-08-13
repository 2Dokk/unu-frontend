export type ProjectMode = "PERSONAL" | "FIXED_TEAM" | "RECRUITING";

export const PROJECT_MODE_OPTIONS: {
  mode: ProjectMode;
  label: string;
  description: string;
}[] = [
  {
    mode: "PERSONAL",
    label: "개인 프로젝트",
    description: "담당자 혼자 진행하며 학회 활동 목록에는 공개하지 않습니다.",
  },
  {
    mode: "FIXED_TEAM",
    label: "정해진 팀원과 진행",
    description: "함께 시작할 학회원을 등록하고 추가 신청은 받지 않습니다.",
  },
  {
    mode: "RECRUITING",
    label: "추가 팀원 모집",
    description: "함께 시작할 학회원을 등록하고 추가 신청도 받습니다.",
  },
];

interface ProjectModeFields {
  /** 학회 활동 목록 공개 여부 */
  listed: boolean;
  /** 개설 직후 활동 상태 */
  status: "CREATED" | "OPEN";
  /** 함께 시작할 학회원을 고를 수 있는지 */
  allowsInitialMembers: boolean;
  /** 참여 정원을 직접 입력받는지 */
  allowsParticipantLimit: boolean;
}

const PROJECT_MODE_FIELDS: Record<ProjectMode, ProjectModeFields> = {
  PERSONAL: {
    listed: false,
    status: "CREATED",
    allowsInitialMembers: false,
    allowsParticipantLimit: false,
  },
  FIXED_TEAM: {
    listed: true,
    status: "CREATED",
    allowsInitialMembers: true,
    allowsParticipantLimit: false,
  },
  RECRUITING: {
    listed: true,
    status: "OPEN",
    allowsInitialMembers: true,
    allowsParticipantLimit: true,
  },
};

export function projectModeFields(mode: ProjectMode): ProjectModeFields {
  return PROJECT_MODE_FIELDS[mode];
}

/** 저장된 활동에서 진행 방식을 역으로 복원한다. */
export function deriveProjectMode(activity: {
  listed?: boolean;
  status?: string;
}): ProjectMode {
  if (activity.listed === false) return "PERSONAL";
  return activity.status === "OPEN" ? "RECRUITING" : "FIXED_TEAM";
}
