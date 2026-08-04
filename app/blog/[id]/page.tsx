"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { MarkdownPreview } from "@/components/custom/markdown-editor";
import { DefaultBlogThumbnail } from "@/components/custom/blog/default-blog-thumbnail";
import { Button } from "@/components/ui/button";
import { getBlogPostById, deleteBlogPost } from "@/lib/api/blog";
import { BlogPost } from "@/lib/interfaces/blog";
import { useAuth } from "@/lib/contexts/AuthContext";

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

  const isAuthor = !!userId && post?.createdBy?.id === userId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || hasRole("MANAGER");

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 space-y-6">
        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
        <div className="aspect-video w-full bg-muted animate-pulse rounded-xl" />
        <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 text-center">
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
    <main className="mx-auto w-full max-w-3xl px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground -ml-2"
          onClick={() => router.push("/blog")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">목록으로</span>
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
              <span className="hidden sm:inline">수정</span>
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
              <span className="hidden sm:inline">삭제</span>
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {post.category === "tech" ? "Tech" : "Essay"}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{post.title}</h1>
        {post.subtitle && (
          <p className="text-base sm:text-lg text-muted-foreground">{post.subtitle}</p>
        )}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
            {post.createdBy?.name?.charAt(0) || "?"}
          </div>
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-medium">
                {post.createdBy?.name || "알 수 없음"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{date}</p>
          </div>
        </div>
      </div>

      <hr />

      {post.thumbnailUrl ? (
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-[8px] bg-muted after:pointer-events-none after:absolute after:inset-0 after:z-10 after:rounded-[8px] after:ring-1 after:ring-inset after:ring-[#bdbdbd]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <DefaultBlogThumbnail
          title={post.title}
          className="aspect-[2/1] w-full"
        />
      )}

      <article className="prose-sm sm:prose max-w-none!">
        <MarkdownPreview content={post.description} />
      </article>
    </main>
  );
}
