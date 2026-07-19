export interface PortfolioRequest {
  title: string;
  description: string;
  thumbnailUrl: string;
  images: string[];
  tags: string[];
  team: string;
  year: number;
}

export interface PortfolioResponse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  images: string[];
  tags: string[];
  team: string;
  year: number;
  createdAt: string;
}

export interface PortfolioListResponse {
  portfolios: PortfolioResponse[];
  total: number;
}
