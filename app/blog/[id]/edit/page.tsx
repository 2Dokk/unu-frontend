"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/custom/markdown-editor";
import { getBlogPostById, updateBlogPost } from "@/lib/api/blog";
import { uploadImage, deleteImage } from "@/lib/api/image";
import { BlogRequest, BlogCategory } from "@/lib/interfaces/blog";

const CATEGORY_OPTIONS: { value: BlogCategory; label: string }[] = [
  { value: "tech", label: "Tech" },
  { value: "essay", label: "Essay" },
];

export default function BlogEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<BlogRequest | null>(null);
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

  useEffect(() => {
    getBlogPostById(id).then((post) => {
      if (!post) return;
      setForm({
        title: post.title,
        subtitle: post.subtitle,
        content: post.content,
        thumbnailUrl: post.thumbnailUrl,
        category: post.category,
      });
    });
  }, [id]);

  const set = (field: keyof BlogRequest, value: string) =>
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await updateBlogPost(id, form);
      router.push(`/blog/${id}`);
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
        onClick={() => router.push(`/blog/${id}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        돌아가기
      </Button>

      <h1 className="text-xl font-bold">글 수정</h1>

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
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">부제목</label>
          <Input
            value={form.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">썸네일 URL</label>
          <Input
            value={form.thumbnailUrl}
            onChange={(e) => set("thumbnailUrl", e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">본문</label>
          <MarkdownEditor
            value={form.content}
            onChange={(v) => set("content", v)}
            onImageUpload={uploadImage}
            onImageUploaded={(url) => sessionUploadedRef.current.add(url)}
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
