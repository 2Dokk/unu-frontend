export const STATUS_TONES = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  negative: "border-red-200 bg-red-50 text-red-700 hover:bg-red-50",
  pending: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
  neutral: "border-border bg-muted/50 text-muted-foreground hover:bg-muted/50",
} as const;

export function applicationStatusTone(status: string): string {
  switch (status) {
    case "PASSED":
    case "APPROVED":
      return STATUS_TONES.positive;
    case "REJECTED":
      return STATUS_TONES.negative;
    case "IN_PROGRESS":
    case "HOLD":
      return STATUS_TONES.pending;
    default:
      return STATUS_TONES.neutral;
  }
}
