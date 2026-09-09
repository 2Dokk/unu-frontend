import { ActivityResponse } from "@/lib/interfaces/activity";

/** 로컬 기준 오늘 날짜를 "yyyy-MM-dd"로. (toISOString은 UTC로 밀려서 쓰지 않는다) */
export function localDateValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type RecruitmentPeriod = Pick<
  ActivityResponse,
  "recruitmentStartDate" | "recruitmentEndDate"
>;

/**
 * 모집 여부는 활동 status와 분리해 모집 기간으로만 판단한다.
 * 모집 기간이 없으면 모집 기능이 없는 활동으로 본다.
 * 백엔드 ActivityParticipantService.isRecruitmentOpen과 같은 규칙이어야 한다.
 */
export function isActivityRecruiting(activity: RecruitmentPeriod): boolean {
  const start = activity.recruitmentStartDate;
  const end = activity.recruitmentEndDate;

  if (!start || !end) return false;

  const today = localDateValue();
  return today >= start && today <= end;
}

export function activityRecruitmentDeadlineLabel(
  activity: RecruitmentPeriod,
): string | null {
  if (!isActivityRecruiting(activity) || !activity.recruitmentEndDate) {
    return null;
  }

  const [, month, day] = activity.recruitmentEndDate.split("-").map(Number);
  return `~${month}.${day}`;
}

/** 모집 기간과 활동 종료일을 기준으로 화면에 표시할 상태를 계산한다. */
export function activityDisplayStatus(
  activity: RecruitmentPeriod & Pick<ActivityResponse, "endDate"> & { status: string },
): string {
  if (activity.status === "COMPLETED") return "COMPLETED";

  const today = localDateValue();
  if (activity.endDate && today > activity.endDate) return "COMPLETED";

  const start = activity.recruitmentStartDate;
  const end = activity.recruitmentEndDate;
  if (!start || !end) return activity.status;

  if (today < start) return "CREATED";
  if (today <= end) return "OPEN";
  return "ONGOING";
}
