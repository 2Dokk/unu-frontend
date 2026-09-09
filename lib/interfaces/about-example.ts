import { AboutExampleCategory } from "@/lib/about-sections";

export interface AboutExample {
  id: string;
  category: AboutExampleCategory;
  title: string;
  description: string;
  thumbnailUrl: string;
  createdAt: string;
  modifiedAt: string | null;
}

export interface AboutExampleRequest {
  category: AboutExampleCategory;
  title: string;
  description: string;
  thumbnailUrl: string;
}
