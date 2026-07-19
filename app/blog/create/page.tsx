"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/custom/markdown-editor";
import { createBlogPost } from "@/lib/api/blog";
import { uploadImage, deleteImage } from "@/lib/api/image";
import { BlogRequest, BlogCategory } from "@/lib/interfaces/blog";

const CATEGORY_OPTIONS: { value: BlogCategory; label: string }[] = [
  { value: "tech", label: "Tech" },
  { value: "essay", label: "Essay" },
];

export default function BlogCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<BlogRequest>({
    title: "",
    subtitle: "",
    content: "",
    thumbnailUrl: "",
    category: "tech",
  });
  const [submitting, setSubmitting] = useState(false);

  const sessionUploadedRef = useRef<Set<string>>(new Set());
  const submittedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (submittedRef.current) return;
      sessionUploadedRef.current.forEach((url) => {
        deleteImage(url).catch(() => {});
      });
    };
  }, []);

  const set = (field: keyof BlogRequest, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const post = await createBlogPost(form);
      router.push(`/blog/${post.id}`);
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
        onClick={() => router.push("/blog")}
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Button>

      <h1 className="text-xl font-bold">글 작성</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">카테고리</label>
          <div className="flex gap-2">
            {CATEGORY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set("category", value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  form.category === value
                    ? "bg-muted text-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">제목</label>
          <Input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="제목을 입력하세요"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">부제목</label>
          <Input
            value={form.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="한 줄 요약"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">썸네일 URL</label>
          <Input
            value={form.thumbnailUrl}
            onChange={(e) => set("thumbnailUrl", e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">본문</label>
          <MarkdownEditor
            value={form.content}
            onChange={(v) => set("content", v)}
            onImageUpload={uploadImage}
            onImageUploaded={(url) => sessionUploadedRef.current.add(url)}
            placeholder="마크다운으로 작성하세요. 이미지는 붙여넣기(Ctrl+V) 또는 드래그&드롭으로 삽입할 수 있습니다."
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
