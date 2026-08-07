export interface ContributorInput {
  // 학회원은 userId, 외부 인원은 name을 채워 보낸다.
  userId: string | null;
  name: string | null;
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
  // 목록 키. 학회원은 userId와 같고, 외부 인원은 서버가 만든 "ext:N" 또는 로컬 생성 id.
  id: string;
  // 학회원이면 userId, 외부 인원이면 null
  userId: string | null;
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
