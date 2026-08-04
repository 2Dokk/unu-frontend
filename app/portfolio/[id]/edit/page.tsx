"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotionEditor } from "@/components/custom/blog/notion-editor";
import { UploadedImagePicker } from "@/components/custom/uploaded-image-picker";
import { QuarterSelector } from "@/components/custom/quarter/quarter-selector";
import { ContributorPicker } from "@/components/custom/portfolio/contributor-picker";
import { getPortfolioById, updatePortfolio } from "@/lib/api/portfolio";
import { uploadImage, deleteImage } from "@/lib/api/image";
import { ContributorInfo } from "@/lib/interfaces/portfolio";
import { cn } from "@/lib/utils";

export default function PortfolioEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [startQuarterId, setStartQuarterId] = useState("");
  const [endQuarterId, setEndQuarterId] = useState("");
  const [isOngoing, setIsOngoing] = useState(false);
  const [contributors, setContributors] = useState<ContributorInfo[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<
    { id: string; url: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const sessionIdsRef = useRef<Set<string>>(new Set());
  const submittedRef = useRef(false);

  useEffect(() => {
    getPortfolioById(id).then((p) => {
      if (!p) return;
      setTitle(p.title);
      setDescription(p.description);
      setThumbnailUrl(p.thumbnailUrl);
      setStartQuarterId(p.startQuarterId ?? "");
      setEndQuarterId(p.endQuarterId ?? "");
      setIsOngoing(!p.endQuarterId);
      setContributors(p.contributors);
      setLoaded(true);
      requestAnimationFrame(() => {
        if (titleRef.current) {
          titleRef.current.style.height = "auto";
          titleRef.current.style.height = titleRef.current.scrollHeight + "px";
        }
      });
    });
  }, [id]);

  useEffect(() => {
    return () => {
      if (submittedRef.current) return;
      sessionIdsRef.current.forEach((imgId) =>
        deleteImage(imgId).catch(() => {}),
      );
    };
  }, []);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const handleImageUploaded = useCallback((imgId: string, url: string) => {
    sessionIdsRef.current.add(imgId);
    setUploadedImages((prev) => [...prev, { id: imgId, url }]);
    setShowImagePicker(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      titleRef.current?.focus();
      return;
    }
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await updatePortfolio(id, {
        title,
        description,
        thumbnailUrl,
        startQuarterId,
        endQuarterId: isOngoing ? "" : endQuarterId,
        contributors: contributors.map((c) => ({
          userId: c.id,
          role: c.role,
        })),
      });
      router.push(`/portfolio/${id}`);
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6">
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </main>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-6"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground -ml-2"
          onClick={() => router.push(`/portfolio/${id}`)}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">돌아가기</span>
        </Button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowImagePicker((v) => !v)}
            className={cn(
              "flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors",
              showImagePicker
                ? "text-foreground bg-muted"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">대표이미지</span>
          </button>

          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>

      {/* Title */}
      <textarea
        ref={titleRef}
        rows={1}
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          autoResize(e.target);
        }}
        placeholder="프로젝트 이름"
        className="w-full resize-none overflow-hidden bg-transparent border-none outline-none text-3xl sm:text-4xl font-bold placeholder:text-muted-foreground/30 leading-tight"
      />

      {/* Quarters + contributors */}
      <div className="mt-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              시작 분기
            </label>
            <QuarterSelector
              value={startQuarterId}
              onChange={setStartQuarterId}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                종료 분기
              </label>
              <button
                type="button"
                onClick={() => setIsOngoing((v) => !v)}
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full transition-colors",
                  isOngoing
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isOngoing ? "진행 중" : "진행 중으로 표시"}
              </button>
            </div>
            {isOngoing ? (
              <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                진행 중
              </div>
            ) : (
              <QuarterSelector
                value={endQuarterId}
                onChange={setEndQuarterId}
                minQuarterId={startQuarterId}
              />
            )}
          </div>
        </div>

        <ContributorPicker
          contributors={contributors}
          onChange={setContributors}
        />
      </div>

      {/* Thumbnail picker (toggle) */}
      {showImagePicker && (
        <div className="mt-4 space-y-2">
          {uploadedImages.length > 0 ? (
            <UploadedImagePicker
              images={uploadedImages}
              selectedUrl={thumbnailUrl}
              onSelect={setThumbnailUrl}
            />
          ) : (
            <div className="space-y-1">
              {thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl}
                  alt="현재 대표 이미지"
                  className="h-16 w-16 rounded-md object-cover border"
                />
              )}
              <p className="text-xs text-muted-foreground">
                에디터에서 새 이미지를 업로드하면 여기서 선택할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="my-6 border-t" />

      {/* Body editor */}
      <NotionEditor
        value={description}
        onChange={setDescription}
        onImageUpload={uploadImage}
        onImageUploaded={handleImageUploaded}
      />
    </form>
  );
}
