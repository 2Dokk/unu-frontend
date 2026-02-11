export interface ActivitySessionRequestDto {
  activityId: number;
  sessionNumber: number;
  date: string; // ISO date string format (YYYY-MM-DD)
  description: string;
}

export interface ActivitySessionResponseDto {
  id: number;
  activityId: number;
  sessionNumber: number;
  date: string; // ISO date string format (YYYY-MM-DD)
  description: string;
}
