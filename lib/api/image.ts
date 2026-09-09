import axiosInstance from "./axiosInstance";

export interface UploadedImage {
  id: string;
  url: string;
}

export async function uploadImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post<UploadedImage>("/images/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function deleteImage(id: string): Promise<void> {
  await axiosInstance.delete(`/images/${id}`);
}
