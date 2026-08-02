"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { UploadedImagePicker } from "@/components/custom/uploaded-image-picker";

const NotionEditor = dynamic(
  () =>
    import("@/components/custom/blog/notion-editor").then((m) => ({
      default: m.NotionEditor,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-72 bg-muted/40 animate-pulse rounded-lg" />
    ),
  },
);
import { createBlogPost } from "@/lib/api/blog";
import { uploadImage, deleteImage } from "@/lib/api/image";
import { BlogRequest, BlogCategory } from "@/lib/interfaces/blog";
import { cn } from "@/lib/utils";

const CATEGORIES: { value: BlogCategory; label: string }[] = [
  { value: "tech", label: "Tech" },
  { value: "essay", label: "Essay" },
];

export default function BlogCreatePage() {
  const router = useRouter();
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const subtitleRef = useRef<HTMLTextAreaElement>(null);
  const [form, setForm] = useState<BlogRequest>({
    title: "",
    subtitle: "",
    description: "",
    thumbnailUrl: "",
    category: "tech",
  });
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<
    { id: string; url: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const sessionIdsRef = useRef<Set<string>>(new Set());
  const submittedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (submittedRef.current) return;
      sessionIdsRef.current.forEach((id) => deleteImage(id).catch(() => {}));
    };
  }, []);

  const set = (field: keyof BlogRequest, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const handleImageUploaded = useCallback((id: string, url: string) => {
    sessionIdsRef.current.add(id);
    setUploadedImages((prev) => {
      const updated = [...prev, { id, url }];
      return updated;
    });
    setForm((prev) => ({ ...prev, thumbnailUrl: prev.thumbnailUrl || url }));
    setShowImagePicker(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      titleRef.current?.focus();
      return;
    }
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
          onClick={() => router.push("/blog")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">목록으로</span>
        </Button>

        <div className="flex items-center gap-3">
          {/* Category pills */}
          <div className="flex gap-1">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set("category", value)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                  form.category === value
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Thumbnail toggle */}
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
            {submitting ? "저장 중..." : "게시"}
          </Button>
        </div>
      </div>

      {/* Document area */}
      <div className="space-y-1">
        {/* Title */}
        <textarea
          ref={titleRef}
          rows={1}
          value={form.title}
          onChange={(e) => {
            set("title", e.target.value);
            autoResize(e.target);
          }}
          placeholder="제목"
          className="w-full resize-none overflow-hidden bg-transparent border-none outline-none text-3xl sm:text-4xl font-bold placeholder:text-muted-foreground/30 leading-tight"
        />

        {/* Subtitle */}
        <textarea
          ref={subtitleRef}
          rows={1}
          value={form.subtitle}
          onChange={(e) => {
            set("subtitle", e.target.value);
            autoResize(e.target);
          }}
          placeholder="부제목"
          className="w-full resize-none overflow-hidden bg-transparent border-none outline-none text-lg text-muted-foreground placeholder:text-muted-foreground/30 leading-snug"
        />
      </div>

      {/* Thumbnail picker (toggle) */}
      {showImagePicker && (
        <div className="mt-4">
          <UploadedImagePicker
            images={uploadedImages}
            selectedUrl={form.thumbnailUrl}
            onSelect={(url) => set("thumbnailUrl", url)}
          />
        </div>
      )}

      {/* Divider */}
      <div className="my-6 border-t" />

      {/* Body editor */}
      <NotionEditor
        value={form.description}
        onChange={(v) => set("description", v)}
        onImageUpload={uploadImage}
        onImageUploaded={handleImageUploaded}
      />
    </form>
  );
}
