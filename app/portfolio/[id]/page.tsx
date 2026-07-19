"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPortfolioById, deletePortfolio } from "@/lib/api/portfolio";
import { PortfolioResponse } from "@/lib/interfaces/portfolio";
import { useAuth } from "@/lib/contexts/AuthContext";
import { MarkdownPreview } from "@/components/custom/markdown-editor";
import { cn } from "@/lib/utils";

export default function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId, hasRole } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPortfolioById(id)
      .then(setPortfolio)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deletePortfolio(id);
    router.push("/portfolio");
  };

  const isAuthor = !!userId && portfolio?.createdBy === userId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || hasRole("MANAGER");

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
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          onClick={() => router.push("/portfolio")}
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>

        <div className="flex items-center gap-1">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => router.push(`/portfolio/${id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
              수정
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          )}
        </div>
      </div>

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
            {src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={`${portfolio.title} ${i + 1}`}
                className="w-full h-full object-cover"
              />
            )}
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
        <div className="text-muted-foreground leading-relaxed">
          <MarkdownPreview content={portfolio.description} />
        </div>
        <p className="text-xs text-muted-foreground">
          {portfolio.team} · {portfolio.year} ·{" "}
          {new Date(portfolio.createdAt).toLocaleDateString("ko-KR")}
        </p>
      </div>
    </main>
  );
}
