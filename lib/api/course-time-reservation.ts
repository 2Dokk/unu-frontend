import axiosInstance from "./axiosInstance";
import {
  CourseTimeReservationRequest,
  CourseTimeReservationResponse,
} from "../interfaces/course-time-reservation";

export async function createCourseReservation(
  data: CourseTimeReservationRequest,
): Promise<CourseTimeReservationResponse> {
  const response = await axiosInstance.post<CourseTimeReservationResponse>(
    "/course-reservations",
    data,
  );
  return response.data;
}

export async function deleteCourseReservation(id: string): Promise<void> {
  await axiosInstance.delete(`/course-reservations/${id}`);
}

export async function getMyReservations(params: {
  activityId?: string;
  date?: string;
}): Promise<CourseTimeReservationResponse[]> {
  const response = await axiosInstance.get<CourseTimeReservationResponse[]>(
    "/course-reservations/me",
    { params },
  );
  return response.data;
}

export async function getActivityReservations(
  activityId: string,
  date?: string,
): Promise<CourseTimeReservationResponse[]> {
  const response = await axiosInstance.get<CourseTimeReservationResponse[]>(
    `/activities/${activityId}/course-reservations`,
    { params: date ? { date } : undefined },
  );
  return response.data;
}