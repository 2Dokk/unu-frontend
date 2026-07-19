"use client";

import { useRouter } from "next/navigation";
import { PortfolioResponse } from "@/lib/interfaces/portfolio";

interface PortfolioRecentCardProps {
  portfolio: PortfolioResponse;
}

export function PortfolioRecentCard({ portfolio }: PortfolioRecentCardProps) {
  const router = useRouter();

  return (
    <div
      className="cursor-pointer group"
      onClick={() => router.push(`/portfolio/${portfolio.id}`)}
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
        {portfolio.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portfolio.thumbnailUrl}
            alt={portfolio.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <div className="mt-3 space-y-0.5">
        <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {portfolio.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {portfolio.team} · {portfolio.year}
        </p>
      </div>
    </div>
  );
}
