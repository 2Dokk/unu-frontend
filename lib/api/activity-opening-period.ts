import axiosInstance from "./axiosInstance";
import {
  ActivityOpeningPeriodPayload,
  ActivityOpeningPeriodResponse,
} from "../interfaces/activity-opening-period";

const BASE_PATH = "/activity-opening-periods/current";
const MANAGE_PATH = "/manage/activity-opening-periods/current";

export async function getCurrentActivityOpeningPeriod(): Promise<ActivityOpeningPeriodResponse> {
  const response = await axiosInstance.get<ActivityOpeningPeriodResponse>(BASE_PATH);
  return response.data;
}

export async function getCurrentActivityOpeningPeriodForManagement(): Promise<ActivityOpeningPeriodResponse> {
  const response = await axiosInstance.get<ActivityOpeningPeriodResponse>(MANAGE_PATH);
  return response.data;
}

export async function updateCurrentActivityOpeningPeriod(
  data: ActivityOpeningPeriodPayload,
): Promise<ActivityOpeningPeriodResponse> {
  const response = await axiosInstance.put<ActivityOpeningPeriodResponse>(
    MANAGE_PATH,
    data,
  );
  return response.data;
}
