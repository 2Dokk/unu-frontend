import {
  PortfolioListResponse,
  PortfolioResponse,
} from "@/lib/interfaces/portfolio";

const DUMMY_PORTFOLIOS: PortfolioResponse[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000",
    title: "CNU 동아리 웹사이트 리뉴얼",
    description:
      "동아리 활동 관리 및 모집 공고를 위한 웹사이트를 React + Next.js로 전면 리뉴얼했습니다.",
    thumbnailUrl: "https://placehold.co/600x400/orange/FFFFFF/png",
    images: [
      "https://placehold.co/600x400/pink/FFFFFF/png",
      "https://placehold.co/600x400/000000/FFFFFF/png",
      "https://placehold.co/600x400/000000/FFFFFF/png",
    ],
    tags: ["React", "Next.js", "TypeScript"],
    team: "웹 개발팀",
    year: 2024,
    createdAt: "2024-03-01T00:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    title: "머신러닝 스터디 프로젝트",
    description:
      "MNIST 데이터셋을 활용한 손글씨 분류 모델을 개발하고 웹 데모를 구현했습니다.",
    thumbnailUrl: "https://placehold.co/600x400/blue/FFFFFF/png",
    images: [
      "https://placehold.co/600x400/000000/FFFFFF/png",
      "https://placehold.co/600x400/000000/FFFFFF/png",
    ],
    tags: ["Python", "PyTorch", "ML"],
    team: "AI 스터디",
    year: 2024,
    createdAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    title: "모바일 출석 체크 앱",
    description:
      "QR 코드 기반 출석 관리 시스템을 Flutter로 개발했습니다. iOS/Android 동시 지원.",
    thumbnailUrl: "https://placehold.co/600x400/green/FFFFFF/png",
    images: [
      "https://placehold.co/600x400/000000/FFFFFF/png",
      "https://placehold.co/600x400/000000/FFFFFF/png",
      "https://placehold.co/600x400/000000/FFFFFF/png",
    ],
    tags: ["Flutter", "Dart", "Firebase"],
    team: "모바일팀",
    year: 2023,
    createdAt: "2023-11-20T00:00:00Z",
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440003",
    title: "알고리즘 스터디 시각화 툴",
    description:
      "정렬 알고리즘의 동작 과정을 실시간으로 시각화하는 웹 도구를 개발했습니다.",
    thumbnailUrl: "https://placehold.co/600x400/purple/FFFFFF/png",
    images: [
      "https://placehold.co/600x400/000000/FFFFFF/png",
      "https://placehold.co/600x400/000000/FFFFFF/png",
    ],
    tags: ["JavaScript", "Canvas", "Algorithm"],
    team: "알고리즘팀",
    year: 2023,
    createdAt: "2023-09-05T00:00:00Z",
  },
];

export async function getPortfolios(): Promise<PortfolioListResponse> {
  return {
    portfolios: DUMMY_PORTFOLIOS,
    total: DUMMY_PORTFOLIOS.length,
  };
}

export async function getPortfolioById(
  id: string,
): Promise<PortfolioResponse | null> {
  return DUMMY_PORTFOLIOS.find((p) => p.id === id) ?? null;
}
