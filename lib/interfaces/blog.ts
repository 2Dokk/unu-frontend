import { AuditorDto } from "@/lib/interfaces/auth";

export type BlogCategory = "tech" | "essay";

export interface BlogRequest {
  title: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
  category: BlogCategory;
}

export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  thumbnailUrl: string;
  category: BlogCategory;
  createdBy: AuditorDto;
  createdAt: string;
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
}
