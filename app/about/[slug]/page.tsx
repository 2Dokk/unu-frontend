"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteAboutExample,
  getAboutExamples,
  reorderAboutExamples,
} from "@/lib/api/about-example";
import { getAboutSection } from "@/lib/about-sections";
import { AboutExample } from "@/lib/interfaces/about-example";
import { useAuth } from "@/lib/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/custom/scroll-reveal";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AboutSectionDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { hasRole } = useAuth();
  const section = getAboutSection(params.slug);
  const [examples, setExamples] = useState<AboutExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<AboutExample | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const loadExamples = useCallback(async () => {
    if (!section) return;
    setLoading(true);
    try {
      setExamples(await getAboutExamples(section.category));
    } catch {
      toast.error("소개 글을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    if (!section) {
      router.replace("/about");
      return;
    }
    void loadExamples();
  }, [loadExamples, router, section]);

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await deleteAboutExample(deleting.id);
      setExamples((current) =>
        current.filter((example) => example.id !== deleting.id),
      );
      setDeleting(null);
      toast.success("소개 글을 삭제했습니다.");
    } catch {
      toast.error("소개 글을 삭제하지 못했습니다.");
    } finally {
      setDeletePending(false);
    }
  };

  const persistOrder = async (next: AboutExample[]) => {
    const previous = examples;
    setExamples(next);
    setSavingOrder(true);
    try {
      await reorderAboutExamples(next.map((example) => example.id));
    } catch {
      setExamples(previous);
      toast.error("순서를 저장하지 못했습니다.");
    } finally {
      setSavingOrder(false);
    }
  };

  const moveExample = (from: number, to: number) => {
    if (from === to) return;
    const next = [...examples];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    void persistOrder(next);
  };

  const handleDragStart = (index: number) => {
    dragIndex.current = index;
    setDragOverIndex(index);
  };

  const handleDragEnterItem = (index: number) => {
    if (dragIndex.current === null) return;
    setDragOverIndex(index);
  };

  const handleDropItem = (index: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIndex(null);
    if (from === null) return;
    moveExample(from, index);
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setDragOverIndex(null);
  };

  if (!section) return null;

  const canManage = hasRole("MANAGER");

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-white text-[#14231b]">
      <section className="relative overflow-hidden bg-[#14231b] text-white">
        <ScrollReveal
          aria-hidden="true"
          eager
          delay={120}
          distance={12}
          className="pointer-events-none absolute top-2/3 right-[12%] hidden -translate-y-1/2 select-none xl:block"
        >
          <span className="font-cnu-display text-[clamp(96px,12vw,164px)] leading-none font-bold text-white/[0.035]">
            {section.watermark}
          </span>
        </ScrollReveal>

        <div className="relative z-10 mx-auto flex min-h-[240px] w-full max-w-7xl items-center px-6 py-12 sm:min-h-[280px]">
          <ScrollReveal eager distance={18} className="max-w-4xl">
            <Link
              href="/about"
              className="mb-6 inline-flex items-center gap-2 text-lg font-semibold text-white/55  transition-colors hover:text-white"
            >
              <ArrowLeft className="size-5" />
              소개
            </Link>
            <p className="text-sm font-semibold text-[#83caa4]">
              {section.groupTitle}
            </p>
            <h1 className="mt-2 font-cnu-body text-[36px] leading-[1.08] font-bold sm:text-5xl">
              {section.title}
            </h1>
            <p className="mt-5 max-w-4xl whitespace-pre-line text-base leading-7 text-white/65 sm:text-lg sm:leading-8">
              {section.description}
            </p>
          </ScrollReveal>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-5 border-b border-[#14231b]/20 pb-5">
          <div>
            {/* <p className="text-sm font-semibold text-[#40795b]">CNU 기록</p> */}
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              {section.caseTitle}
            </h2>
          </div>
          {canManage && (
            <Button
              asChild
              size="sm"
              className="bg-[#14231b] text-white hover:bg-[#244333]"
            >
              <Link href={`/about/${section.slug}/create`}>
                <Plus className="size-4" />
                작성
              </Link>
            </Button>
          )}
        </div>

        {canManage && !loading && examples.length > 1 && (
          <p className="mb-6 -mt-2 text-xs font-medium text-[#14231b]/45">
            손잡이를 잡고 위아래로 드래그하면 표시 순서를 바꿀 수 있습니다.
          </p>
        )}

        {loading ? (
          <div className="space-y-6">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="grid animate-pulse gap-5 border-b border-[#14231b]/10 pb-6 sm:grid-cols-[260px_minmax(0,1fr)]"
              >
                <div className="aspect-[16/10] rounded-md bg-[#eef2ef]" />
                <div className="space-y-4 py-2">
                  <div className="h-7 w-2/5 rounded bg-[#eef2ef]" />
                  <div className="h-4 w-full rounded bg-[#eef2ef]" />
                  <div className="h-4 w-4/5 rounded bg-[#eef2ef]" />
                </div>
              </div>
            ))}
          </div>
        ) : examples.length === 0 ? (
          <div className="border-b border-[#14231b]/15 py-16 text-center">
            <p className="text-sm font-medium text-[#14231b]/50">
              아직 등록된 내용이 없습니다.
            </p>
          </div>
        ) : (
          <div>
            {examples.map((example, index) => (
              <ScrollReveal
                key={example.id}
                eager
                className="border-b border-[#14231b]/15 py-7 first:pt-0"
              >
                <article
                  className={cn(
                    "grid gap-6 sm:grid-cols-[260px_minmax(0,1fr)] sm:items-center lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-9",
                    canManage && "rounded-md transition-[box-shadow,opacity]",
                    canManage &&
                      dragOverIndex === index &&
                      dragIndex.current !== null &&
                      "ring-2 ring-[#40795b]/55 ring-offset-4 ring-offset-white",
                    canManage &&
                      dragIndex.current === index &&
                      "opacity-40",
                    savingOrder && "pointer-events-none opacity-70",
                  )}
                  onDragEnter={
                    canManage ? () => handleDragEnterItem(index) : undefined
                  }
                  onDragOver={
                    canManage ? (event) => event.preventDefault() : undefined
                  }
                  onDrop={
                    canManage
                      ? (event) => {
                          event.preventDefault();
                          handleDropItem(index);
                        }
                      : undefined
                  }
                  onDragEnd={canManage ? handleDragEnd : undefined}
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-md border border-[#14231b]/10 bg-[#eef2ef]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={example.thumbnailUrl}
                      alt={example.title}
                      draggable={false}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl leading-8 font-bold sm:text-2xl">
                        {example.title}
                      </h3>
                      {canManage && (
                        <div className="flex shrink-0 items-center gap-1">
                          <span
                            role="button"
                            tabIndex={-1}
                            aria-label={`${example.title} 순서 변경 손잡이`}
                            title="드래그하여 순서 변경"
                            draggable={!savingOrder}
                            onDragStart={() => handleDragStart(index)}
                            onDragEnd={handleDragEnd}
                            className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-[#14231b]/35 transition-colors hover:text-[#14231b]/70 active:cursor-grabbing"
                          >
                            <GripVertical className="size-4" />
                          </span>
                          <Button
                            asChild
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            title="수정"
                            aria-label={`${example.title} 수정`}
                          >
                            <Link
                              href={`/about/${section.slug}/${example.id}/edit`}
                            >
                              <Pencil className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            title="삭제"
                            aria-label={`${example.title} 삭제`}
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleting(example)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 whitespace-pre-line text-[15px] leading-7 font-medium text-[#14231b]/68 sm:text-base sm:leading-7">
                      {example.description}
                    </p>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>

      <AlertDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open && !deletePending) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>소개 글을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleting?.title ?? "선택한 글"}과 등록된 이미지가 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deletePending}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deletePending ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
