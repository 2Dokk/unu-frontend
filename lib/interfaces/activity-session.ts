import { ActivityResponse } from "./activity";

export interface ActivitySessionRequestDto {
  activityId: string;
  sessionNumber: number;
  date: string; // ISO date string format (YYYY-MM-DD)
  description: string;
}

export interface ActivitySessionResponseDto {
  id: string;
  activity: ActivityResponse;
  sessionNumber: number;
  date: string; // ISO date string format (YYYY-MM-DD)
  description: string;
}
