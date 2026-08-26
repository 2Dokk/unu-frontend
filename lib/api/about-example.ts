import axiosInstance from "@/lib/api/axiosInstance";
import publicClient from "@/lib/api/publicClient";
import { AboutExampleCategory } from "@/lib/about-sections";
import {
  AboutExample,
  AboutExampleRequest,
} from "@/lib/interfaces/about-example";

export function getAboutExamples(category: AboutExampleCategory) {
  return publicClient.get<AboutExample[]>(
    `/public/about-examples?category=${encodeURIComponent(category)}`,
  );
}

export function getAboutExample(id: string) {
  return publicClient.get<AboutExample>(`/public/about-examples/${id}`);
}

export async function createAboutExample(data: AboutExampleRequest) {
  const response = await axiosInstance.post<AboutExample>(
    "/about-examples",
    data,
  );
  return response.data;
}

export async function updateAboutExample(
  id: string,
  data: AboutExampleRequest,
) {
  const response = await axiosInstance.put<AboutExample>(
    `/about-examples/${id}`,
    data,
  );
  return response.data;
}

export async function deleteAboutExample(id: string) {
  await axiosInstance.delete(`/about-examples/${id}`);
}

export async function reorderAboutExamples(orderedIds: string[]) {
  await axiosInstance.patch("/about-examples/reorder", { orderedIds });
}
