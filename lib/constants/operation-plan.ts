/** 계획서를 쓰는 활동 유형과 유형별 표시 이름 */
const OPERATION_PLAN_LABELS: Record<string, string> = {
  PROJECT: "운영 계획서",
  SPECIAL_LECTURE: "강의계획서",
  STUDY: "스터디계획서",
};

export function operationPlanLabel(activityTypeCode?: string): string | null {
  if (!activityTypeCode) return null;
  return OPERATION_PLAN_LABELS[activityTypeCode] ?? null;
}

/** 계획서를 링크로 등록한 경우 클릭 가능하게 렌더링하기 위한 판별 */
export function isOperationPlanUrl(plan: string): boolean {
  const trimmed = plan.trim();
  if (/\s/.test(trimmed)) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
