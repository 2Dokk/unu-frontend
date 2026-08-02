"use client";

import { useRouter } from "next/navigation";
import { BlogPost } from "@/lib/interfaces/blog";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
  const router = useRouter();
  const date = new Date(post.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Extract plain text preview from markdown description
  const preview = post.description
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^[-*>]\s+/gm, "")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 120);

  return (
    <div
      className="flex gap-3 sm:gap-4 cursor-pointer group py-4 border-b last:border-b-0"
      onClick={() => router.push(`/blog/${post.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative w-32 h-24 sm:w-52 sm:h-36 rounded-lg overflow-hidden shrink-0 bg-muted">
        {post.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnailUrl}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 sm:line-clamp-1 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          {(post.subtitle || preview) && (
            <p className="hidden sm:block text-sm text-muted-foreground line-clamp-2">
              {post.subtitle || preview}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5 sm:mt-2">
          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
            {post.category === "tech" ? "Tech" : "Essay"}
          </span>
          <span className="text-xs text-muted-foreground">
            {post.createdBy?.name || "알 수 없음"}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{date}</span>
        </div>
      </div>
    </div>
  );
}
