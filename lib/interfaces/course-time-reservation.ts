import { ActivityResponse } from "./activity";
import { UserResponseDto } from "./auth";

export interface CourseTimeReservationRequest {
  activityId: string;
  startAt: string; // "yyyy-MM-dd'T'HH:mm:ss"
  endAt: string;
}

export interface CourseTimeReservationResponse {
  id: string;
  activity: ActivityResponse;
  user: UserResponseDto;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  createdAt: string;
}