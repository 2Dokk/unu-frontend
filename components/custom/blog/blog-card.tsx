"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { BlogPost } from "@/lib/interfaces/blog";

const CATEGORY_LABEL: Record<string, string> = {
  tech: "Tech",
  essay: "Essay",
};

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

  return (
    <div
      className="flex gap-4 cursor-pointer group py-4 border-b last:border-b-0"
      onClick={() => router.push(`/blog/${post.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative w-28 h-20 sm:w-36 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {post.thumbnailUrl && (
          <Image
            src={post.thumbnailUrl}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 112px, 144px"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
        <div className="space-y-1">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {post.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-2">
          <span>{post.createdBy}</span>
          <span>·</span>
          <span>{date}</span>
          <span>·</span>
          <span className="font-medium text-foreground">
            {CATEGORY_LABEL[post.category]}
          </span>
        </div>
      </div>
    </div>
  );
}
