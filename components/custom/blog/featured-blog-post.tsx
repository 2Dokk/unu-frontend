import Link from "next/link";
import { BlogPost } from "@/lib/interfaces/blog";
import { DefaultBlogThumbnail } from "@/components/custom/blog/default-blog-thumbnail";

interface FeaturedBlogPostProps {
  post: BlogPost;
}

export function FeaturedBlogPost({ post }: FeaturedBlogPostProps) {
  const date = new Date(post.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link
      href={`/blog/${post.id}`}
      className="group grid min-w-0 gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.9fr)] md:items-stretch md:gap-10"
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
            titleClassName="text-2xl sm:text-4xl"
          />
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-between py-1 md:py-3">
        <div>
          <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {post.category === "tech" ? "Tech" : "Essay"}
          </span>
          <h2 className="mt-4 line-clamp-3 text-3xl leading-tight font-bold transition-colors group-hover:text-primary sm:text-4xl">
            {post.title}
          </h2>
          {post.subtitle && (
            <p className="mt-4 line-clamp-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {post.subtitle}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-foreground">
            {post.createdBy?.name?.charAt(0) || "?"}
          </span>
          <span>{post.createdBy?.name || "알 수 없음"}</span>
          <span aria-hidden="true">·</span>
          <span>{date}</span>
        </div>
      </div>
    </Link>
  );
}
