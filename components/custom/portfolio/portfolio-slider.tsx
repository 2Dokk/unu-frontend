"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PortfolioResponse } from "@/lib/interfaces/portfolio";
import { cn } from "@/lib/utils";

interface PortfolioSliderProps {
  portfolios: PortfolioResponse[];
}

// Each card occupies 76% of the container; 12% peeks on each side.
const CARD_WIDTH_PCT = 52;
const PEEK_PCT = (100 - CARD_WIDTH_PCT) / 2; // 12%
const GAP_PX = 20;

export function PortfolioSlider({ portfolios }: PortfolioSliderProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const total = portfolios.length;

  const prev = () => setCurrent((c) => (c - 1 + total) % total);
  const next = () => setCurrent((c) => (c + 1) % total);

  if (total === 0) return null;

  // Normalize offset so wrapping cards peek correctly (-1 / +1 only)
  const normalize = (raw: number) => {
    if (raw > total / 2) return raw - total;
    if (raw < -total / 2) return raw + total;
    return raw;
  };

  return (
    <div className="relative">
      {/* Slide Track */}
      <div className="relative overflow-hidden h-96 md:h-112">
        {portfolios.map((portfolio, i) => {
          const offset = normalize(i - current);
          const isCurrent = offset === 0;
          const isAdjacent = Math.abs(offset) === 1;

          return (
            <div
              key={portfolio.id}
              aria-hidden={!isCurrent && !isAdjacent}
              className="absolute top-0 h-full transition-all duration-500 ease-in-out"
              style={{
                width: `${CARD_WIDTH_PCT}%`,
                left: `${PEEK_PCT}%`,
                transform: `translateX(calc(${offset * 100}% + ${offset * GAP_PX}px)) scale(${isCurrent ? 1 : 0.93})`,
                opacity: isCurrent ? 1 : isAdjacent ? 0.45 : 0,
                zIndex: isCurrent ? 10 : 5,
                cursor: isCurrent ? "pointer" : "pointer",
              }}
              onClick={() => {
                if (isCurrent) {
                  router.push(`/portfolio/${portfolio.id}`);
                } else {
                  setCurrent(i);
                }
              }}
            >
              <div className="relative h-full rounded-2xl overflow-hidden shadow-sm">
                {/* Thumbnail — fills entire card */}
                <Image
                  src={portfolio.thumbnailUrl}
                  alt={portfolio.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 76vw, 52vw"
                  priority={i === 0}
                />

                {/* Content overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 bg-black/50 backdrop-blur-sm px-6 py-5 flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1">
                    {portfolio.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h2 className="text-lg md:text-xl font-bold leading-snug text-white line-clamp-1">
                    {portfolio.title}
                  </h2>
                  <p className="text-sm text-white/70 leading-relaxed line-clamp-2">
                    {portfolio.description}
                  </p>
                  <p className="text-xs text-white/50">
                    {new Date(portfolio.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Prev / Next */}
      {total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background border shadow-sm hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-background border shadow-sm hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {total > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {portfolios.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === current
                  ? "w-6 bg-foreground"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
