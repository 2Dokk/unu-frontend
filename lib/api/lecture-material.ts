import axiosInstance from "./axiosInstance";
import {
  LectureMaterial,
  LectureMaterialRequest,
} from "@/lib/interfaces/lecture-material";

export async function getLectureMaterials(): Promise<LectureMaterial[]> {
  const response = await axiosInstance.get<LectureMaterial[]>(
    "/lecture-materials",
  );
  return response.data;
}

export async function getLectureMaterialsByActivity(
  activityId: string,
): Promise<LectureMaterial[]> {
  const response = await axiosInstance.get<LectureMaterial[]>(
    `/lecture-materials/activity/${activityId}`,
  );
  return response.data;
}

export async function createLectureMaterial(
  data: LectureMaterialRequest,
): Promise<LectureMaterial> {
  const response = await axiosInstance.post<LectureMaterial>(
    "/lecture-materials",
    data,
  );
  return response.data;
}

export async function updateLectureMaterial(
  id: string,
  data: LectureMaterialRequest,
): Promise<LectureMaterial> {
  const response = await axiosInstance.put<LectureMaterial>(
    `/lecture-materials/${id}`,
    data,
  );
  return response.data;
}

export async function deleteLectureMaterial(id: string): Promise<void> {
  await axiosInstance.delete(`/lecture-materials/${id}`);
}

export async function reorderLectureMaterials(
  orderedIds: string[],
): Promise<void> {
  await axiosInstance.patch("/lecture-materials/reorder", { orderedIds });
}
