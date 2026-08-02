"use client";

import { useRouter } from "next/navigation";
import { PortfolioResponse } from "@/lib/interfaces/portfolio";

interface PortfolioCardProps {
  portfolio: PortfolioResponse;
}

export function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const router = useRouter();

  const period = portfolio.endQuarterName
    ? `${portfolio.startQuarterName} - ${portfolio.endQuarterName}`
    : `${portfolio.startQuarterName} - 진행 중`;

  const contributorNames = portfolio.contributors.map((c) => c.name).join(", ");

  return (
    <div
      className="group cursor-pointer rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-md transition-shadow"
      onClick={() => router.push(`/portfolio/${portfolio.id}`)}
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        {portfolio.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portfolio.thumbnailUrl}
            alt={portfolio.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>

      <div className="p-4 space-y-1.5">
        <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
          {portfolio.title}
        </h3>
        {contributorNames && (
          <p className="text-sm text-muted-foreground line-clamp-1">{contributorNames}</p>
        )}
        <p className="text-xs text-muted-foreground">{period}</p>
      </div>
    </div>
  );
}
