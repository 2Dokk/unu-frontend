import { supabase } from "./supabase";
import type {
  DomainErrorCode,
  Lecture,
  LectureAccount,
  Reservation,
  ReservationCartItem,
} from "./types";

interface BootstrapResponse {
  lectures: Lecture[];
  reservations: Reservation[];
}

/**
 * RPC가 RAISE EXCEPTION으로 던진 도메인 코드를 뽑아낸다.
 * Postgres 예외는 PostgREST를 거치면서 message 안에 코드 문자열로 실려온다.
 */
const DOMAIN_CODES: DomainErrorCode[] = [
  "NOT_A_MEMBER",
  "AUTH_FAILED",
  "NO_ENROLLMENT",
  "RATE_LIMITED",
  "NOT_ENROLLED",
  "DAILY_LIMIT_EXCEEDED",
  "WEEKLY_LIMIT_EXCEEDED",
  "RESERVATION_WINDOW_EXCEEDED",
  "INVALID_RESERVATION_TIME",
  "PAST_RESERVATION_TIME",
  "CONTINUOUS_LIMIT_EXCEEDED",
  "TIME_CONFLICT",
  "ALREADY_RESERVED",
];

export class ApiError extends Error {
  code: DomainErrorCode | null;
  constructor(message: string, code: DomainErrorCode | null) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

function toApiError(error: { message?: string } | null): ApiError {
  const message = error?.message ?? "알 수 없는 오류";
  const code = DOMAIN_CODES.find((c) => message.includes(c)) ?? null;
  return new ApiError(message, code);
}

async function request<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch("/api/online-lecture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = (await response.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
  };

  if (!response.ok) throw toApiError({ message: result.error });
  return result.data as T;
}

/** 도메인 에러 코드를 사용자에게 보여줄 문구로 */
export function messageFor(err: unknown, fallback = "요청을 처리하지 못했습니다."): string {
  if (!(err instanceof ApiError)) return fallback;
  switch (err.code) {
    case "NOT_A_MEMBER":
      return "학회원 정보가 확인되지 않습니다. 학번과 이름을 다시 확인해주세요.";
    case "AUTH_FAILED":
      return "학번, 이름, 인증 코드를 다시 확인해주세요.";
    case "NO_ENROLLMENT":
      return "인강 수강 대상자가 아닙니다.";
    case "RATE_LIMITED":
      return "요청이 너무 많습니다. 1분 후 다시 시도해주세요.";
    case "NOT_ENROLLED":
      return "신청하지 않은 강의는 예약할 수 없습니다.";
    case "DAILY_LIMIT_EXCEEDED":
      return "예약 가능 시간을 초과했습니다.";
    case "WEEKLY_LIMIT_EXCEEDED":
      return "강의별 일주일 예약은 최대 4시간까지 가능합니다.";
    case "RESERVATION_WINDOW_EXCEEDED":
      return "오늘부터 3주 이내 날짜만 예약할 수 있어요.";
    case "INVALID_RESERVATION_TIME":
      return "예약 시간이 올바르지 않습니다.";
    case "PAST_RESERVATION_TIME":
      return "이미 지난 시간은 예약할 수 없습니다.";
    case "CONTINUOUS_LIMIT_EXCEEDED":
      return "연속 예약은 최대 2시간까지만 가능합니다.";
    case "TIME_CONFLICT":
      return "같은 시간에는 한 강의만 예약할 수 있습니다.";
    case "ALREADY_RESERVED":
      return "선택한 시간 중 이미 예약된 시간이 있습니다. 새로고침 후 다시 시도해주세요.";
    default:
      return fallback;
  }
}

export async function bootstrap(): Promise<BootstrapResponse> {
  return request<BootstrapResponse>({ action: "bootstrap" });
}

/** 특정 강의/날짜에 이미 찬 시간들. */
export async function getReservedSlots(lecture: string, date: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("get_reserved_slots", {
    p_lecture: lecture,
    p_date: date,
  });
  if (error) throw toApiError(error);
  return ((data ?? []) as { res_time: string }[]).map((r) => r.res_time);
}

export async function getMyReservations(): Promise<Reservation[]> {
  return request<Reservation[]>({ action: "my-reservations" });
}

export async function getLectureAccount(
  lecture: string,
  date: string,
): Promise<LectureAccount | null> {
  return request<LectureAccount | null>({
    action: "lecture-account",
    lecture,
    date,
  });
}

export async function saveReservationCart(
  items: ReservationCartItem[],
): Promise<void> {
  await request<null>({
    action: "save-cart",
    items,
  });
}

/** 삭제된 행 수를 반환한다. 0이면 아무것도 지워지지 않은 것. */
export async function cancelReservations(
  ids: number[],
): Promise<number> {
  return request<number>({ action: "cancel", ids });
}
