import {
  BlogListResponse,
  BlogPost,
  BlogCategory,
  BlogRequest,
} from "@/lib/interfaces/blog";
import publicClient from "./publicClient";
import axiosInstance from "./axiosInstance";

// 백엔드는 TECH/ESSAY 대문자로 반환 → 프론트 타입에 맞게 소문자로 정규화
function normalizePost(post: BlogPost): BlogPost {
  return { ...post, category: post.category.toLowerCase() as BlogCategory };
}

export async function getBlogPosts(
  category?: BlogCategory,
): Promise<BlogListResponse> {
  const path = category
    ? `/public/blogs?category=${category.toUpperCase()}`
    : "/public/blogs";
  const res = await publicClient.get<BlogListResponse>(path);
  return { ...res, posts: res.posts.map(normalizePost) };
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const post = await publicClient.get<BlogPost>(`/public/blogs/${id}`);
  return normalizePost(post);
}

export async function createBlogPost(data: BlogRequest): Promise<BlogPost> {
  const response = await axiosInstance.post<BlogPost>("/blogs", {
    ...data,
    category: data.category.toUpperCase(),
  });
  return normalizePost(response.data);
}

export async function updateBlogPost(
  id: string,
  data: BlogRequest,
): Promise<BlogPost> {
  const response = await axiosInstance.put<BlogPost>(`/blogs/${id}`, {
    ...data,
    category: data.category.toUpperCase(),
  });
  return normalizePost(response.data);
}

export async function deleteBlogPost(id: string): Promise<void> {
  await axiosInstance.delete(`/blogs/${id}`);
}
