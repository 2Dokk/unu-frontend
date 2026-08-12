import axiosInstance from "./axiosInstance";
import {
  ActivityNotice,
  ActivityNoticeRequest,
} from "@/lib/interfaces/activity-notice";

export async function getActivityNotices(
  activityId: string,
): Promise<ActivityNotice[]> {
  const response = await axiosInstance.get<ActivityNotice[]>(
    "/activity-notices",
    { params: { activityId } },
  );
  return response.data;
}

export async function createActivityNotice(
  data: ActivityNoticeRequest,
): Promise<ActivityNotice> {
  const response = await axiosInstance.post<ActivityNotice>(
    "/activity-notices",
    data,
  );
  return response.data;
}

export async function updateActivityNotice(
  id: string,
  data: ActivityNoticeRequest,
): Promise<ActivityNotice> {
  const response = await axiosInstance.put<ActivityNotice>(
    `/activity-notices/${id}`,
    data,
  );
  return response.data;
}

export async function deleteActivityNotice(id: string): Promise<void> {
  await axiosInstance.delete(`/activity-notices/${id}`);
}
