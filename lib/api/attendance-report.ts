import axiosInstance from "./axiosInstance";
import {
  AttendanceReportRequest,
  AttendanceReportResponse,
} from "../interfaces/attendance-report";

export const createAttendanceReport = async (
  data: AttendanceReportRequest,
): Promise<AttendanceReportResponse> => {
  const response = await axiosInstance.post<AttendanceReportResponse>(
    "/attendance-reports",
    data,
  );
  return response.data;
};

export const getAttendanceReportByAttendanceId = async (
  attendanceId: string,
): Promise<AttendanceReportResponse | null> => {
  try {
    const response = await axiosInstance.get<AttendanceReportResponse>(
      `/attendance-reports/attendances/${attendanceId}`,
    );
    return response.data;
  } catch {
    return null;
  }
};
