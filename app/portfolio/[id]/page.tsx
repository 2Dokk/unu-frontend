"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPortfolioById } from "@/lib/api/portfolio";
import { PortfolioResponse } from "@/lib/interfaces/portfolio";
import { cn } from "@/lib/utils";

export default function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortfolioById(id)
      .then(setPortfolio)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-xl bg-muted animate-pulse aspect-video w-full" />
      </main>
    );
  }

  if (!portfolio) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10 text-center">
        <p className="text-muted-foreground">포트폴리오를 찾을 수 없습니다.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/portfolio")}>
          목록으로 돌아가기
        </Button>
      </main>
    );
  }

  const total = portfolio.images.length;
  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-muted-foreground"
        onClick={() => router.push("/portfolio")}
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Button>

      {/* Image Slider */}
      <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
        {portfolio.images.map((src, i) => (
          <div
            key={i}
            className={cn(
              "absolute inset-0 transition-opacity duration-500",
              i === current ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <Image
              src={src}
              alt={`${portfolio.title} ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority={i === 0}
            />
          </div>
        ))}

        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Dot Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {portfolio.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === current ? "w-5 bg-white" : "w-2 bg-white/50"
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">{portfolio.title}</h1>
        <div className="flex flex-wrap gap-1.5">
          {portfolio.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <p className="text-muted-foreground leading-relaxed">{portfolio.description}</p>
        <p className="text-xs text-muted-foreground">
          {new Date(portfolio.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </div>
    </main>
  );
}
