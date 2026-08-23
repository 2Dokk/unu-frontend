export const ACTIVITY_RETURN_TARGETS = {
  activities: { path: "/activities", label: "학회 활동으로" },
  home: { path: "/home", label: "내 활동으로" },
  "home-activities": {
    path: "/home/activities",
    label: "전체 활동으로",
  },
  "home-completed": {
    path: "/home/completed",
    label: "수료 활동으로",
  },
} as const;

export type ActivityReturnSource = keyof typeof ACTIVITY_RETURN_TARGETS;

export function resolveActivityReturnSource(
  value: string | null,
): ActivityReturnSource | null {
  return value && value in ACTIVITY_RETURN_TARGETS
    ? (value as ActivityReturnSource)
    : null;
}
