import { BlogListResponse, BlogPost, BlogRequest, BlogCategory } from "@/lib/interfaces/blog";
import publicClient, { ApiError } from "./publicClient";
import axiosInstance from "./axiosInstance";

const CACHE_TTL_MS = 60_000;

interface CacheEntry<T> {
  value: T;
  storedAt: number;
}

const blogListCache = new Map<string, CacheEntry<BlogListResponse>>();
const blogListRequests = new Map<string, Promise<BlogListResponse>>();
const blogPostCache = new Map<string, CacheEntry<BlogPost>>();
const blogPostRequests = new Map<string, Promise<BlogPost | null>>();
let blogCacheGeneration = 0;

function normalizePost(post: BlogPost): BlogPost {
  return { ...post, category: post.category?.toLowerCase() as BlogCategory };
}

function isFresh<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
  return !!entry && Date.now() - entry.storedAt < CACHE_TTL_MS;
}

function cachePost(post: BlogPost, storedAt = Date.now()) {
  blogPostCache.set(post.id, { value: post, storedAt });
}

function invalidateBlogCache() {
  blogCacheGeneration += 1;
  blogListCache.clear();
  blogListRequests.clear();
  blogPostRequests.clear();
}

export function getCachedBlogPosts(
  category?: BlogCategory,
): BlogListResponse | undefined {
  return blogListCache.get(category ?? "all")?.value;
}

export function getCachedBlogPostById(id: string): BlogPost | undefined {
  return blogPostCache.get(id)?.value;
}

export async function getBlogPosts(category?: BlogCategory): Promise<BlogListResponse> {
  const cacheKey = category ?? "all";
  const cached = blogListCache.get(cacheKey);
  if (isFresh(cached)) return cached.value;

  const pending = blogListRequests.get(cacheKey);
  if (pending) return pending;

  const path = category
    ? `/public/blogs?category=${category.toUpperCase()}`
    : "/public/blogs";
  const requestGeneration = blogCacheGeneration;
  const request = publicClient
    .get<BlogListResponse>(path)
    .then((res) => {
      const value = { ...res, posts: res.posts.map(normalizePost) };
      if (requestGeneration === blogCacheGeneration) {
        const storedAt = Date.now();
        blogListCache.set(cacheKey, { value, storedAt });
        value.posts.forEach((post) => cachePost(post, storedAt));
      }
      return value;
    })
    .finally(() => {
      if (blogListRequests.get(cacheKey) === request) {
        blogListRequests.delete(cacheKey);
      }
    });

  blogListRequests.set(cacheKey, request);
  return request;
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const cached = blogPostCache.get(id);
  if (isFresh(cached)) return cached.value;

  const pending = blogPostRequests.get(id);
  if (pending) return pending;

  const requestGeneration = blogCacheGeneration;
  const request = publicClient
    .get<BlogPost>(`/public/blogs/${id}`)
    .then((post) => {
      const value = normalizePost(post);
      if (requestGeneration === blogCacheGeneration) cachePost(value);
      return value;
    })
    .catch((error) => {
      if (error instanceof ApiError && error.status === 404) {
        blogPostCache.delete(id);
        return null;
      }
      throw error;
    })
    .finally(() => {
      if (blogPostRequests.get(id) === request) {
        blogPostRequests.delete(id);
      }
    });

  blogPostRequests.set(id, request);
  return request;
}

export async function createBlogPost(data: BlogRequest): Promise<BlogPost> {
  const response = await axiosInstance.post<BlogPost>("/blogs", {
    ...data,
    category: data.category.toUpperCase(),
  });
  const post = normalizePost(response.data);
  invalidateBlogCache();
  cachePost(post);
  return post;
}

export async function updateBlogPost(id: string, data: BlogRequest): Promise<BlogPost> {
  const response = await axiosInstance.put<BlogPost>(`/blogs/${id}`, {
    ...data,
    category: data.category.toUpperCase(),
  });
  const post = normalizePost(response.data);
  invalidateBlogCache();
  cachePost(post);
  return post;
}

export async function deleteBlogPost(id: string): Promise<void> {
  await axiosInstance.delete(`/blogs/${id}`);
  invalidateBlogCache();
  blogPostCache.delete(id);
}
