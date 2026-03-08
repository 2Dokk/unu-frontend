export interface AttendanceReportRequest {
  sessionId: string;
  participantId: string;
  title: string;
  content: string;
}

export interface AttendanceReportResponse {
  id: string;
  title: string;
  content: string;
  attendanceId: string;
  sessionId: string;
  participantId: string;
  attendanceStatus: string;
  createdAt: string;
}
