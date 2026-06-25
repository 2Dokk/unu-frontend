"use client";

import { useEffect, useState } from "react";
import { getPortfolios } from "@/lib/api/portfolio";
import { PortfolioResponse } from "@/lib/interfaces/portfolio";
import { PortfolioSlider } from "@/components/custom/portfolio/portfolio-slider";
import { PortfolioRecentCard } from "@/components/custom/portfolio/portfolio-recent-card";

export default function PortfolioPage() {
  const [portfolios, setPortfolios] = useState<PortfolioResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortfolios()
      .then((res) => setPortfolios(res.portfolios))
      .finally(() => setLoading(false));
  }, []);

  const recent = portfolios
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold mb-1">Portfolio</h1>
        <p className="text-muted-foreground text-sm">
          CNU가 만들어온 활동을 소개합니다.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border bg-muted animate-pulse h-120 w-full" />
      ) : (
        <PortfolioSlider portfolios={portfolios} />
      )}

      {/* Recent */}
      {!loading && recent.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-base font-semibold">최신 프로젝트</h2>
          <div className="grid grid-cols-2 gap-5">
            {recent.map((p) => (
              <PortfolioRecentCard key={p.id} portfolio={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
