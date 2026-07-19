"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/custom/markdown-editor";
import { PortfolioImageManager } from "@/components/custom/portfolio/portfolio-image-manager";
import { getPortfolioById, updatePortfolio } from "@/lib/api/portfolio";
import { uploadImage, deleteImage } from "@/lib/api/image";
import { PortfolioRequest } from "@/lib/interfaces/portfolio";

const CURRENT_YEAR = new Date().getFullYear();

export default function PortfolioEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<PortfolioRequest | null>(null);
  const [tagsText, setTagsText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Only newly uploaded images are tracked for cleanup (pre-existing ones are kept)
  const sessionUploadedRef = useRef<Set<string>>(new Set());
  const submittedRef = useRef(false);

  useEffect(() => {
    getPortfolioById(id).then((p) => {
      if (!p) return;
      setForm({
        title: p.title,
        description: p.description,
        thumbnailUrl: p.thumbnailUrl,
        images: p.images,
        tags: p.tags,
        team: p.team,
        year: p.year,
      });
      setTagsText(p.tags.join(", "));
    });
  }, [id]);

  useEffect(() => {
    return () => {
      if (submittedRef.current) return;
      // Delete only images newly uploaded this session
      sessionUploadedRef.current.forEach((url) => {
        deleteImage(url).catch(() => {});
      });
    };
  }, []);

  const set = (field: keyof PortfolioRequest, value: unknown) =>
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));

  const handleAddImage = (url: string) => {
    sessionUploadedRef.current.add(url);
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        images: [...prev.images, url],
        thumbnailUrl: prev.thumbnailUrl || url,
      };
    });
  };

  const handleRemoveImage = (url: string) => {
    // Only delete from server if it was uploaded this session
    if (sessionUploadedRef.current.has(url)) {
      sessionUploadedRef.current.delete(url);
      deleteImage(url).catch(() => {});
    }
    setForm((prev) => {
      if (!prev) return prev;
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
    if (!form) return;
    const payload: PortfolioRequest = {
      ...form,
      tags: tagsText.split(",").map((s) => s.trim()).filter(Boolean),
    };
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await updatePortfolio(id, payload);
      router.push(`/portfolio/${id}`);
    } catch {
      submittedRef.current = false;
      setSubmitting(false);
    }
  };

  if (!form) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-8">
        <div className="h-96 bg-muted animate-pulse rounded-xl" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8 space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-muted-foreground"
        onClick={() => router.push(`/portfolio/${id}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        돌아가기
      </Button>

      <h1 className="text-xl font-bold">포트폴리오 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">제목</label>
          <Input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
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
            minHeight={300}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">팀 이름</label>
            <Input
              value={form.team}
              onChange={(e) => set("team", e.target.value)}
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
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "저장 중..." : "저장"}
          </Button>
        </div>
      </form>
    </main>
  );
}
