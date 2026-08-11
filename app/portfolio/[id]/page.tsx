"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Pencil, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPortfolioById,
  getCachedPortfolioById,
  getCachedPortfolios,
  getPortfolios,
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
  const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(
    () => getCachedPortfolioById(id) ?? null,
  );
  const [loading, setLoading] = useState(
    () => !getCachedPortfolioById(id),
  );
  const [otherPortfolios, setOtherPortfolios] = useState<PortfolioResponse[]>(
    () =>
      (getCachedPortfolios()?.portfolios ?? [])
        .filter((item) => item.id !== id)
        .slice(0, 3),
  );

  useEffect(() => {
    const cached = getCachedPortfolioById(id);
    setPortfolio(cached ?? null);
    setLoading(!cached);

    getPortfolioById(id)
      .then(setPortfolio)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    getPortfolios()
      .then(({ portfolios }) => {
        if (cancelled) return;
        setOtherPortfolios(
          portfolios.filter((item) => item.id !== id).slice(0, 3),
        );
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
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
  // ADMIN만 남의 글을 건드릴 수 있다. MANAGER는 자기 글만.
  const canManage = hasRole("ADMIN") || (hasRole("MANAGER") && isAuthor);
  const canEdit = canManage;
  const canDelete = canManage;

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
          aria-label="포트폴리오 목록으로"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">목록으로</span>
        </Button>

        <div className="flex items-center gap-1">
          {hasRole("MANAGER") && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={handleTogglePin}
              aria-label={portfolio.pinned ? "고정 해제" : "포트폴리오 고정"}
              title={portfolio.pinned ? "고정 해제" : "포트폴리오 고정"}
            >
              <Pin
                className={cn("h-4 w-4", portfolio.pinned && "fill-current")}
              />
              <span className="hidden sm:inline">
                {portfolio.pinned ? "고정됨" : "고정"}
              </span>
            </Button>
          )}
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => router.push(`/portfolio/${id}/edit`)}
              aria-label="포트폴리오 수정"
              title="포트폴리오 수정"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">수정</span>
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-destructive hover:text-destructive"
              onClick={handleDelete}
              aria-label="포트폴리오 삭제"
              title="포트폴리오 삭제"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">삭제</span>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-full bg-foreground px-3 py-1 text-xs font-medium text-background">
            {period}
          </span>
          <span className="text-sm text-muted-foreground">{createdDate}</span>
        </div>

        <h1 className="break-words text-4xl font-bold">{portfolio.title}</h1>

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
        <MarkdownPreview
          content={portfolio.description}
          hiddenImageUrl={portfolio.thumbnailUrl || undefined}
        />
      </article>

      <div className="pt-12 sm:pt-16">
        {otherPortfolios.length > 0 && (
          <section
            className="border-t border-black/15 pt-8"
            aria-labelledby="other-portfolios-heading"
          >
            <h2
              id="other-portfolios-heading"
              className="font-cnu-display text-3xl font-bold sm:text-4xl"
            >
              다른 활동
            </h2>

            <div className="mt-5 divide-y divide-black/10 border-y border-black/10">
              {otherPortfolios.map((item) => {
                const itemPeriod = item.endQuarterName
                  ? `${item.startQuarterName} ~ ${item.endQuarterName}`
                  : `${item.startQuarterName} ~ 진행 중`;
                const contributorNames = item.contributors
                  .map((contributor) => contributor.name)
                  .join(", ");
                const itemDate = new Date(item.createdAt).toLocaleDateString(
                  "ko-KR",
                  { year: "numeric", month: "long", day: "numeric" },
                );

                return (
                  <Link
                    key={item.id}
                    href={`/portfolio/${item.id}`}
                    className="group flex min-w-0 items-center gap-4 py-5 sm:gap-6"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-[#2d6f50]">
                          {itemPeriod}
                        </span>
                        {contributorNames && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate">{contributorNames}</span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{itemDate}</span>
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-lg leading-snug font-semibold transition-colors group-hover:text-[#2d6f50] sm:text-xl">
                        {item.title}
                      </h3>
                    </div>
                    <ArrowRight className="size-5 shrink-0 text-[#2d6f50] transition-transform group-hover:translate-x-1" />
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <div className="flex justify-center pt-10">
          <Link
            href="/portfolio"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#14231b] bg-white px-7 text-sm font-semibold text-[#14231b] transition-colors hover:bg-[#14231b] hover:text-white sm:text-base"
          >
            <ArrowLeft className="size-4" />
            활동 목록으로
          </Link>
        </div>
      </div>
    </main>
  );
}
