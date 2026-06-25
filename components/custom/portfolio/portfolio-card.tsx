"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PortfolioResponse } from "@/lib/interfaces/portfolio";
import { cn } from "@/lib/utils";

interface PortfolioCardProps {
  portfolio: PortfolioResponse;
}

export function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const total = portfolio.images.length;

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((c) => (c - 1 + total) % total);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrent((c) => (c + 1) % total);
  };

  return (
    <div
      className="group cursor-pointer rounded-xl overflow-hidden border bg-card shadow-sm hover:shadow-md transition-shadow"
      onClick={() => router.push(`/portfolio/${portfolio.id}`)}
    >
      {/* Image Slider */}
      <div className="relative aspect-video overflow-hidden bg-muted">
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
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={i === 0}
            />
          </div>
        ))}

        {/* Prev / Next buttons */}
        {total > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {total > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {portfolio.images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrent(i);
                }}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === current ? "w-4 bg-white" : "w-1.5 bg-white/50"
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
          {portfolio.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {portfolio.description}
        </p>
        <div className="flex flex-wrap gap-1 pt-1">
          {portfolio.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
