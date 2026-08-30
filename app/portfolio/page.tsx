"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCachedPortfolios, getPortfolios } from "@/lib/api/portfolio";
import { PortfolioResponse } from "@/lib/interfaces/portfolio";
import { PortfolioSlider } from "@/components/custom/portfolio/portfolio-slider";
import { PortfolioRecentCard } from "@/components/custom/portfolio/portfolio-recent-card";
import { ScrollReveal } from "@/components/custom/scroll-reveal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function PortfolioPage() {
  const router = useRouter();
  const { hasRole } = useAuth();
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
  const sliderPortfolios = [
    ...pinned,
    ...portfolios.filter((portfolio) => !portfolio.pinned),
  ];

  return (
    <main className="w-full bg-white">
      <section className="relative overflow-hidden bg-[#14231b] text-white">
        <ScrollReveal
          aria-hidden="true"
          delay={120}
          distance={12}
          className="pointer-events-none absolute top-2/3 right-[14%] hidden select-none xl:block"
        >
          <span className="block -translate-y-1/2 font-cnu-display text-[clamp(96px,12vw,170px)] leading-none font-bold text-white/[0.035]">
            portfolio
          </span>
        </ScrollReveal>
        <div className="relative z-10 mx-auto flex min-h-[240px] w-full max-w-7xl items-center px-6 py-12 sm:min-h-[280px]">
          <ScrollReveal distance={18}>
            <h1 className="font-cnu-body text-[42px] leading-[1.08] font-bold sm:text-6xl">
              활동
            </h1>
            <p className="mt-5 text-lg text-white/65 sm:text-xl">
              CNU가 만들어온 활동을 소개합니다.
            </p>
            {hasRole("MANAGER") && (
              <Button
                size="sm"
                className="mt-7 border border-white/25 bg-white text-[#14231b] hover:bg-white/90"
                onClick={() => router.push("/portfolio/create")}
              >
                추가
              </Button>
            )}
          </ScrollReveal>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-10 px-6 py-10 sm:py-12">
        {loading ? (
          <div className="rounded-2xl border bg-muted animate-pulse h-120 w-full" />
        ) : (
          <ScrollReveal>
            <PortfolioSlider portfolios={sliderPortfolios} />
          </ScrollReveal>
        )}

        {/* Recent */}
        {!loading && portfolios.length > 0 && (
          <section className="space-y-4">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {portfolios.map((p, index) => (
                <ScrollReveal
                  key={p.id}
                  delay={(index % 2) * 100}
                  className="h-full"
                >
                  <PortfolioRecentCard portfolio={p} />
                </ScrollReveal>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
