"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicNotices } from "@/lib/api/notice";
import { Notice } from "@/lib/interfaces/notice";
import { formatDotDate } from "@/lib/utils/date-utils";

const NOTICES_PER_PAGE = 10;

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicNotices()
      .then(({ notices: loadedNotices }) => setNotices(loadedNotices))
      .catch((error) => {
        console.error("Failed to load notices:", error);
        toast.error("학회 공지를 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredNotices = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
    if (!normalizedQuery) return notices;
    return notices.filter((notice) =>
      [notice.title, notice.tag, notice.content].some((value) =>
        value.toLocaleLowerCase("ko-KR").includes(normalizedQuery),
      ),
    );
  }, [notices, query]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotices.length / NOTICES_PER_PAGE),
  );
  const paginatedNotices = filteredNotices.slice(
    (currentPage - 1) * NOTICES_PER_PAGE,
    currentPage * NOTICES_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">학회 공지</h1>
        <p className="text-sm text-muted-foreground">
          학회 운영과 활동에 관한 주요 안내를 확인하세요
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목 또는 내용 검색"
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          총 {filteredNotices.length}건
        </p>
      </div>

      {loading ? (
        <Card className="py-0">
          <CardContent className="divide-y p-0">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 px-5 py-5 sm:px-6"
              >
                <Skeleton className="h-6 w-16" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : paginatedNotices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Bell className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {query ? "검색 결과가 없습니다." : "등록된 공지가 없습니다."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <CardContent className="divide-y p-0">
            {paginatedNotices.map((notice) => (
              <button
                key={notice.id}
                type="button"
                onClick={() => setSelectedNotice(notice)}
                className="group flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50 sm:px-6 sm:py-5"
              >
                <Badge variant="secondary" className="max-w-24 shrink-0 truncate">
                  {notice.tag}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium sm:text-base">
                    {notice.title}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground sm:text-sm">
                    {notice.content}
                  </p>
                </div>
                <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDotDate(notice.createdAt)}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 border-t pt-5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="이전 페이지"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-16 text-center text-sm text-muted-foreground">
            {currentPage} / {totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="다음 페이지"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
          >
            <ChevronRight />
          </Button>
        </div>
      )}

      <Dialog
        open={selectedNotice !== null}
        onOpenChange={(open) => !open && setSelectedNotice(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="space-y-3 text-left">
            <div>
              <Badge variant="secondary">{selectedNotice?.tag}</Badge>
            </div>
            <DialogTitle className="pr-6 text-xl leading-snug">
              {selectedNotice?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedNotice ? formatDotDate(selectedNotice.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="whitespace-pre-wrap break-words border-t pt-5 text-sm leading-7 text-foreground">
            {selectedNotice?.content}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
