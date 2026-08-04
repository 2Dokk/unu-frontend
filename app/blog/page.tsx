"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBlogPosts } from "@/lib/api/blog";
import { BlogPost, BlogCategory } from "@/lib/interfaces/blog";
import { BlogCard } from "@/components/custom/blog/blog-card";
import { FeaturedBlogPost } from "@/components/custom/blog/featured-blog-post";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";
import { cn } from "@/lib/utils";

type Filter = "all" | BlogCategory;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "tech", label: "Tech" },
  { value: "essay", label: "Essay" },
];

export default function BlogPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Filter>("all");
  const [featuredPost, ...remainingPosts] = posts;

  useEffect(() => {
    let cancelled = false;

    getBlogPosts(active === "all" ? undefined : active)
      .then((res) => {
        if (!cancelled) setPosts(res.posts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active]);

  const handleFilterChange = (value: Filter) => {
    if (value === active) return;
    setLoading(true);
    setActive(value);
  };

  return (
    <main className="mx-auto w-full max-w-6xl space-y-10 px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-cnu-display mb-3 text-6xl leading-none font-bold sm:text-7xl">
            Blog
          </h1>
        </div>
        {isAuthenticated && (
          <Button
            size="sm"
            className="mt-8"
            onClick={() => router.push("/blog/create")}
          >
            글 작성
          </Button>
        )}
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleFilterChange(value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              active === value
                ? "bg-muted text-foreground"
                : "bg-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-16">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.9fr)] md:gap-10">
            <div className="aspect-[659/455] animate-pulse rounded-[8px] bg-muted" />
            <div className="space-y-4 py-3">
              <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
              <div className="h-10 w-4/5 animate-pulse rounded bg-muted" />
              <div className="h-5 w-full animate-pulse rounded bg-muted" />
              <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="grid gap-x-8 gap-y-14 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[659/455] animate-pulse rounded-[8px] bg-muted" />
                <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          게시글이 없습니다.
        </p>
      ) : featuredPost ? (
        <div className="space-y-16">
          <FeaturedBlogPost post={featuredPost} />
          {remainingPosts.length > 0 && (
            <div className="grid gap-x-8 gap-y-14 md:grid-cols-2">
              {remainingPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}
