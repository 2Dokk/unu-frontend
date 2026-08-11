import { QuarterResponse } from "./quarter";

export type ActivityOpeningPeriodStatus =
  | "NOT_CONFIGURED"
  | "DISABLED"
  | "UPCOMING"
  | "OPEN"
  | "CLOSED";

export interface ActivityOpeningPeriodResponse {
  id?: string | null;
  quarter?: QuarterResponse | null;
  startAt?: string | null;
  endAt?: string | null;
  revisionEndAt?: string | null;
  enabled: boolean;
  status: ActivityOpeningPeriodStatus;
  canApply: boolean;
  canRevise: boolean;
}

export interface ActivityOpeningPeriodPayload {
  startAt: string;
  endAt: string;
  revisionEndAt: string;
  enabled: boolean;
}
