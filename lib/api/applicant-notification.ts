import axiosInstance from "./axiosInstance";
import { ApplicantNotificationSummary } from "@/lib/interfaces/applicant-notification";

export async function getApplicantNotificationSummary(): Promise<ApplicantNotificationSummary> {
  const response = await axiosInstance.get<ApplicantNotificationSummary>(
    "/applicant-notifications/summary",
  );
  return response.data;
}

export async function checkApplicantNotifications(): Promise<ApplicantNotificationSummary> {
  const response = await axiosInstance.post<ApplicantNotificationSummary>(
    "/applicant-notifications/check",
  );
  return response.data;
}
