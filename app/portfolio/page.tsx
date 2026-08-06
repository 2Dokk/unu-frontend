"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCachedPortfolios, getPortfolios } from "@/lib/api/portfolio";
import { PortfolioResponse } from "@/lib/interfaces/portfolio";
import { PortfolioSlider } from "@/components/custom/portfolio/portfolio-slider";
import { PortfolioRecentCard } from "@/components/custom/portfolio/portfolio-recent-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function PortfolioPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioResponse[]>(
    () => getCachedPortfolios()?.portfolios ?? [],
  );
  const [loading, setLoading] = useState(() => !getCachedPortfolios());

  useEffect(() => {
    getPortfolios()
      .then((res) => setPortfolios(res.portfolios))
      .finally(() => setLoading(false));
  }, []);

  const pinned = portfolios.filter((p) => p.pinned);
  const sliderPortfolios = pinned.length > 0 ? pinned : portfolios;

  return (
    <main className="w-full space-y-10 py-8">
      <div className="mx-auto flex w-full max-w-6xl items-start justify-between px-6">
        <div>
          <h1 className="font-cnu-display mb-3 text-6xl leading-[0.92] font-bold sm:text-7xl">
            Portfolio
          </h1>
          <p className="text-muted-foreground text-xl">
            CNU가 만들어온 활동을 소개합니다.
          </p>
        </div>
        {isAuthenticated && (
          <Button size="sm" className="mt-8" onClick={() => router.push("/portfolio/create")}>
            추가
          </Button>
        )}
      </div>

      <div className="mx-auto w-full max-w-7xl space-y-10 px-6">
        {loading ? (
          <div className="rounded-2xl border bg-muted animate-pulse h-120 w-full" />
        ) : (
          <PortfolioSlider portfolios={sliderPortfolios} />
        )}

        {/* Recent */}
        {!loading && portfolios.length > 0 && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {portfolios.map((p) => (
                <PortfolioRecentCard key={p.id} portfolio={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
