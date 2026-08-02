export interface ContributorInput {
  userId: string;
  role: string;
}

export interface PortfolioRequest {
  title: string;
  description: string;
  thumbnailUrl: string;
  startQuarterId: string;
  endQuarterId: string;
  contributors: ContributorInput[];
}

export interface ContributorInfo {
  id: string;
  name: string;
  role: string;
}

export interface PortfolioResponse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  startQuarterId: string;
  startQuarterName: string;
  endQuarterId: string | null;
  endQuarterName: string | null;
  contributors: ContributorInfo[];
  pinned: boolean;
  createdAt: string;
  createdBy: string;
}

export interface PortfolioListResponse {
  portfolios: PortfolioResponse[];
  total: number;
}
