"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/custom/markdown-editor";
import { PortfolioImageManager } from "@/components/custom/portfolio/portfolio-image-manager";
import { createPortfolio } from "@/lib/api/portfolio";
import { uploadImage, deleteImage } from "@/lib/api/image";
import { PortfolioRequest } from "@/lib/interfaces/portfolio";

const CURRENT_YEAR = new Date().getFullYear();

export default function PortfolioCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<PortfolioRequest>({
    title: "",
    description: "",
    thumbnailUrl: "",
    images: [],
    tags: [],
    team: "",
    year: CURRENT_YEAR,
  });
  const [tagsText, setTagsText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Track all images uploaded this session for cleanup
  const sessionUploadedRef = useRef<Set<string>>(new Set());
  const submittedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (submittedRef.current) return;
      // Delete all session-uploaded images that weren't saved
      sessionUploadedRef.current.forEach((url) => {
        deleteImage(url).catch(() => {});
      });
    };
  }, []);

  const set = (field: keyof PortfolioRequest, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAddImage = (url: string) => {
    sessionUploadedRef.current.add(url);
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, url],
      thumbnailUrl: prev.thumbnailUrl || url, // auto-select first as thumbnail
    }));
  };

  const handleRemoveImage = (url: string) => {
    // Immediately delete from server if uploaded this session
    if (sessionUploadedRef.current.has(url)) {
      sessionUploadedRef.current.delete(url);
      deleteImage(url).catch(() => {});
    }
    setForm((prev) => {
      const newImages = prev.images.filter((u) => u !== url);
      return {
        ...prev,
        images: newImages,
        thumbnailUrl: prev.thumbnailUrl === url ? (newImages[0] ?? "") : prev.thumbnailUrl,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PortfolioRequest = {
      ...form,
      tags: tagsText.split(",").map((s) => s.trim()).filter(Boolean),
    };
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const portfolio = await createPortfolio(payload);
      router.push(`/portfolio/${portfolio.id}`);
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-muted-foreground"
        onClick={() => router.push("/portfolio")}
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Button>

      <h1 className="text-xl font-bold">포트폴리오 추가</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">제목</label>
          <Input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="프로젝트 이름"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">이미지</label>
          <PortfolioImageManager
            images={form.images}
            thumbnailUrl={form.thumbnailUrl}
            onAdd={handleAddImage}
            onRemove={handleRemoveImage}
            onSelectThumbnail={(url) => set("thumbnailUrl", url)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">설명</label>
          <MarkdownEditor
            value={form.description}
            onChange={(v) => set("description", v)}
            onImageUpload={uploadImage}
            onImageUploaded={(url) => sessionUploadedRef.current.add(url)}
            placeholder="프로젝트 설명을 마크다운으로 작성하세요."
            minHeight={300}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">팀 이름</label>
            <Input
              value={form.team}
              onChange={(e) => set("team", e.target.value)}
              placeholder="예: 웹 개발팀"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">연도</label>
            <Input
              type="number"
              value={form.year}
              onChange={(e) => set("year", Number(e.target.value))}
              min={2000}
              max={CURRENT_YEAR + 1}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            태그
            <span className="text-xs text-muted-foreground ml-2">(쉼표로 구분)</span>
          </label>
          <Input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="React, TypeScript, Next.js"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "저장 중..." : "게시"}
          </Button>
        </div>
      </form>
    </main>
  );
}
