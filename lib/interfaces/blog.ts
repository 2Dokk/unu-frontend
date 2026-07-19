export type BlogCategory = "tech" | "essay";

export interface BlogRequest {
  title: string;
  subtitle: string;
  content: string;
  thumbnailUrl: string;
  category: BlogCategory;
}

export interface BlogPost {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  thumbnailUrl: string;
  category: BlogCategory;
  createdBy: string;
  createdAt: string;
}

export interface BlogListResponse {
  posts: BlogPost[];
  total: number;
}
