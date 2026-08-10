export type Screen = "auth" | "main" | "detail" | "confirm" | "my";

/** get_lectures_for_member RPC 반환 행 */
export interface Lecture {
  id: number;
  name: string;
  category: string | null;
  /** 난이도. 현재 값은 초급 / 중급 (DB에서 자유 text) */
  level: string | null;
  description: string | null;
  /** member_lectures에 권한이 있는지. false면 목록에 보이되 예약 불가(미신청). */
  enrolled: boolean;
}

/** get_my_reservations RPC 반환 행 */
export interface Reservation {
  id: number;
  lecture: string;
  /** "yyyy-MM-dd" */
  res_date: string;
  /** "HH:30" */
  res_time: string;
}

/** (날짜, 강의)로 묶은 예약. 연속 시간을 한 카드로 보여주기 위한 파생 타입. */
export interface ReservationGroup {
  key: string;
  lecture: string;
  res_date: string;
  times: string[];
  ids: number[];
}

/** 예약한 강의의 인강 계정 정보 */
export interface LectureAccount {
  login_id: string;
  login_password: string;
  course_url: string | null;
  note: string | null;
}

export interface LectureAccountStatus {
  account: LectureAccount | null;
  error: string | null;
}

export interface ReservationCartItem {
  key: string;
  lecture: string;
  date: string;
  /** save_reservations에 넘길 최종 시간표 */
  times: string[];
  /** 이번에 새로 추가되는 시간표 */
  addTimes: string[];
  /** 이번에 취소되는 기존 시간표 */
  removeTimes: string[];
}

export interface BookingItem {
  lecture: string;
  date: string;
  finalTimes: string[];
  addTimes: string[];
  removeTimes: string[];
  account: LectureAccount | null;
  accountError: string | null;
}

/** 예약 완료 화면에 넘길 값 */
export interface Booking extends BookingItem {
  items?: BookingItem[];
}

/** RPC가 RAISE EXCEPTION으로 던지는 도메인 에러 코드 */
export type DomainErrorCode =
  | "NOT_A_MEMBER"
  | "AUTH_FAILED"
  /** 신청한 인강이 하나도 없음 → 로그인 자체가 막힌다 */
  | "NO_ENROLLMENT"
  | "RATE_LIMITED"
  /** 그 강의를 신청하지 않음 → 해당 강의만 예약 불가 */
  | "NOT_ENROLLED"
  | "DAILY_LIMIT_EXCEEDED"
  | "WEEKLY_LIMIT_EXCEEDED"
  | "RESERVATION_WINDOW_EXCEEDED"
  | "INVALID_RESERVATION_TIME"
  | "PAST_RESERVATION_TIME"
  | "CONTINUOUS_LIMIT_EXCEEDED"
  | "TIME_CONFLICT"
  | "ALREADY_RESERVED";
