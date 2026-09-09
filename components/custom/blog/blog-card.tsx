import Link from "next/link";
import { BlogPost } from "@/lib/interfaces/blog";
import { DefaultBlogThumbnail } from "@/components/custom/blog/default-blog-thumbnail";

interface BlogCardProps {
  post: BlogPost;
}

export function BlogCard({ post }: BlogCardProps) {
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
    <Link
      href={`/blog/${post.id}`}
      className="group flex h-full min-w-0 flex-col"
    >
      <div className="relative aspect-[659/455] w-full bg-muted">
        {post.thumbnailUrl ? (
          <div className="h-full w-full overflow-hidden rounded-[8px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.thumbnailUrl}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <DefaultBlogThumbnail
            title={post.title}
            className="h-full w-full"
            titleClassName="text-xl sm:text-3xl"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="space-y-2">
          <h2 className="line-clamp-2 text-xl leading-tight font-semibold transition-colors group-hover:text-primary sm:text-2xl">
            {post.title}
          </h2>
          {(post.subtitle || preview) && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {post.subtitle || preview}
            </p>
          )}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-foreground">
            {post.createdBy?.name?.charAt(0) || "?"}
          </span>
          <span>{post.createdBy?.name || "알 수 없음"}</span>
          <span aria-hidden="true">·</span>
          <span>{date}</span>
          <span className="rounded-full bg-muted px-2 py-1">
            {post.category === "tech" ? "Tech" : "Essay"}
          </span>
        </div>
      </div>
    </Link>
  );
}
