export function activityMaterialLabel(
  activityTypeCode?: string,
): string | null {
  if (activityTypeCode === "STUDY") return "스터디자료 링크";
  if (activityTypeCode === "SPECIAL_LECTURE") return "강의자료 링크";
  if (activityTypeCode === "LECTURE") return "강의 링크";
  return null;
}

export function activityMaterialPlaceholder(activityTypeCode?: string): string {
  return activityTypeCode === "LECTURE"
    ? "인강 링크를 입력해주세요."
    : `${activityMaterialLabel(activityTypeCode) ?? "자료"}가 있다면 입력해주세요.`;
}

export function activityMaterialHelpText(): string {
  return "";
}
