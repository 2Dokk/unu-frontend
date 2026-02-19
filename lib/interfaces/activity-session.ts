import { ActivityResponse } from "./activity";

export interface ActivitySessionRequestDto {
  activityId: number;
  sessionNumber: number;
  date: string; // ISO date string format (YYYY-MM-DD)
  description: string;
}

export interface ActivitySessionResponseDto {
  id: number;
  activity: ActivityResponse;
  sessionNumber: number;
  date: string; // ISO date string format (YYYY-MM-DD)
  description: string;
}
