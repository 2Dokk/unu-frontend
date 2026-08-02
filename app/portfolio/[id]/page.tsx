"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPortfolioById,
  deletePortfolio,
  setPortfolioPinned,
} from "@/lib/api/portfolio";
import { PortfolioResponse } from "@/lib/interfaces/portfolio";
import { useAuth } from "@/lib/contexts/AuthContext";
import { MarkdownPreview } from "@/components/custom/markdown-editor";
import { cn } from "@/lib/utils";

export default function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId, hasRole } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
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

  const handleTogglePin = async () => {
    if (!portfolio) return;
    const updated = await setPortfolioPinned(id, !portfolio.pinned);
    setPortfolio(updated);
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
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => router.push("/portfolio")}
        >
          목록으로 돌아가기
        </Button>
      </main>
    );
  }

  const period = portfolio.endQuarterName
    ? `${portfolio.startQuarterName} ~ ${portfolio.endQuarterName}`
    : `${portfolio.startQuarterName} ~ 진행 중`;

  const created = new Date(portfolio.createdAt);
  const createdDate = `${created.getFullYear()}. ${created.getMonth() + 1}. ${created.getDate()}`;

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
          {hasRole("MANAGER") && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={handleTogglePin}
            >
              <Pin
                className={cn("h-4 w-4", portfolio.pinned && "fill-current")}
              />
              {portfolio.pinned ? "고정됨" : "고정"}
            </Button>
          )}
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

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
            {period}
          </span>
          <span className="text-sm text-muted-foreground">{createdDate}</span>
        </div>

        <h1 className="text-4xl font-bold">{portfolio.title}</h1>

        {portfolio.contributors.length > 0 && (
          <div className="flex flex-wrap gap-4">
            {portfolio.contributors.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  {c.name.slice(-2)}
                </div>
                <div>
                  <p className="text-sm font-medium leading-tight">
                    {c.name}
                  </p>
                  {c.role && (
                    <p className="text-xs text-muted-foreground leading-tight">
                      {c.role}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr />

      <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted">
        {portfolio.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={portfolio.thumbnailUrl}
            alt={portfolio.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <article>
        <MarkdownPreview content={portfolio.description} />
      </article>
    </main>
  );
}
