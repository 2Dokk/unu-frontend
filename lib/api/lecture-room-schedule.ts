import axiosInstance from "./axiosInstance";
import {
  LectureRoomScheduleRequestDto,
  LectureRoomScheduleResponseDto,
} from "../interfaces/lecture-room-schedule";

export async function getLectureRoomSchedulesByQuarter(
  quarterId: string,
  dayOfWeek?: string,
): Promise<LectureRoomScheduleResponseDto[]> {
  const params = dayOfWeek ? { dayOfWeek } : {};
  const response = await axiosInstance.get<LectureRoomScheduleResponseDto[]>(
    `/lecture-room-schedules/quarters/${quarterId}`,
    { params },
  );
  return response.data;
}

export async function createLectureRoomSchedule(
  dto: LectureRoomScheduleRequestDto,
): Promise<LectureRoomScheduleResponseDto> {
  const response = await axiosInstance.post<LectureRoomScheduleResponseDto>(
    "/lecture-room-schedules",
    dto,
  );
  return response.data;
}

export async function createLectureRoomScheduleForMe(
  dto: Omit<LectureRoomScheduleRequestDto, "userId">,
): Promise<LectureRoomScheduleResponseDto> {
  const response = await axiosInstance.post<LectureRoomScheduleResponseDto>(
    "/lecture-room-schedules/me",
    dto,
  );
  return response.data;
}

export async function deleteLectureRoomSchedule(id: string): Promise<void> {
  await axiosInstance.delete(`/lecture-room-schedules/${id}`);
}
