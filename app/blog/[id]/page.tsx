"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { MarkdownPreview } from "@/components/custom/markdown-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBlogPostById, deleteBlogPost } from "@/lib/api/blog";
import { BlogPost } from "@/lib/interfaces/blog";
import { useAuth } from "@/lib/contexts/AuthContext";

const CATEGORY_LABEL: Record<string, string> = {
  tech: "Tech",
  essay: "Essay",
};

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { userId, hasRole } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBlogPostById(id)
      .then(setPost)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    await deleteBlogPost(id);
    router.push("/blog");
  };

  const isAuthor = !!userId && post?.createdBy === userId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || hasRole("MANAGER");

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-8 space-y-6">
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        <div className="aspect-video w-full bg-muted animate-pulse rounded-xl" />
        <div className="space-y-3">
          <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-8 text-center">
        <p className="text-muted-foreground">게시글을 찾을 수 없습니다.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.push("/blog")}>
          목록으로 돌아가기
        </Button>
      </main>
    );
  }

  const date = new Date(post.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          onClick={() => router.push("/blog")}
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로
        </Button>

        <div className="flex items-center gap-1">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => router.push(`/blog/${id}/edit`)}
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

      {/* Thumbnail */}
      {post.thumbnailUrl && (
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-muted">
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 672px"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <Badge variant="secondary">{CATEGORY_LABEL[post.category] ?? post.category}</Badge>
        <h1 className="text-2xl font-bold leading-snug">{post.title}</h1>
        <p className="text-muted-foreground">{post.subtitle}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
          <span>{date}</span>
        </div>
      </div>

      <hr />

      {/* Body */}
      <article>
        <MarkdownPreview content={post.content} />
      </article>
    </main>
  );
}
