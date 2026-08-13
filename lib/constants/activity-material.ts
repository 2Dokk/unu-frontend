export function activityMaterialLabel(
  activityTypeCode?: string,
): string | null {
  if (activityTypeCode === "STUDY") return "스터디 자료";
  if (activityTypeCode === "SPECIAL_LECTURE") return "강의자료";
  return null;
}
