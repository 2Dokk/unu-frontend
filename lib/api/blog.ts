import { BlogListResponse, BlogPost, BlogRequest, BlogCategory } from "@/lib/interfaces/blog";
import publicClient from "./publicClient";
import axiosInstance from "./axiosInstance";

function normalizePost(post: BlogPost): BlogPost {
  return { ...post, category: post.category?.toLowerCase() as BlogCategory };
}

export async function getBlogPosts(category?: BlogCategory): Promise<BlogListResponse> {
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

export async function updateBlogPost(id: string, data: BlogRequest): Promise<BlogPost> {
  const response = await axiosInstance.put<BlogPost>(`/blogs/${id}`, {
    ...data,
    category: data.category.toUpperCase(),
  });
  return normalizePost(response.data);
}

export async function deleteBlogPost(id: string): Promise<void> {
  await axiosInstance.delete(`/blogs/${id}`);
}
