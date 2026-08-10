"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBlogPosts, getCachedBlogPosts } from "@/lib/api/blog";
import { BlogPost, BlogCategory } from "@/lib/interfaces/blog";
import { BlogCard } from "@/components/custom/blog/blog-card";
import { FeaturedBlogPost } from "@/components/custom/blog/featured-blog-post";
import { ScrollReveal } from "@/components/custom/scroll-reveal";
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
  const { hasAnyRole } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>(
    () => getCachedBlogPosts()?.posts ?? [],
  );
  const [loading, setLoading] = useState(() => !getCachedBlogPosts());
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
    const cached = getCachedBlogPosts(value === "all" ? undefined : value);
    setPosts(cached?.posts ?? []);
    setLoading(!cached);
    setActive(value);
  };

  return (
    <main className="w-full bg-white">
      <section className="relative overflow-hidden bg-[#14231b] text-white">
        <ScrollReveal
          aria-hidden="true"
          delay={120}
          distance={12}
          className="pointer-events-none absolute top-2/3 right-[20%] hidden select-none xl:block"
        >
          <span className="block -translate-y-1/2 font-cnu-display text-[clamp(112px,14vw,170px)] leading-none font-bold text-white/[0.035]">
            blog
          </span>
        </ScrollReveal>
        <div className="relative z-10 mx-auto flex min-h-[240px] w-full max-w-7xl items-center px-6 py-12 sm:min-h-[280px]">
          <ScrollReveal distance={18}>
            <h1 className="font-cnu-body text-[42px] leading-[1.08] font-bold sm:text-6xl">
              블로그
            </h1>
            <p className="mt-5 text-lg text-white/65 sm:text-xl">
              기술과 경험, 생각을 기록합니다.
            </p>
            {hasAnyRole(["ADMIN", "MANAGER", "BLOG_MANAGER"]) && (
              <Button
                size="sm"
                className="mt-7 border border-white/25 bg-white text-[#14231b] hover:bg-white/90"
                onClick={() => router.push("/blog/create")}
              >
                글 작성
              </Button>
            )}
          </ScrollReveal>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-10 px-6 py-10 sm:py-12">
        {/* Category filter pills */}
        <ScrollReveal distance={16}>
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
        </ScrollReveal>

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
            <ScrollReveal>
              <FeaturedBlogPost post={featuredPost} />
            </ScrollReveal>
            {remainingPosts.length > 0 && (
              <div className="grid gap-x-8 gap-y-14 md:grid-cols-2">
                {remainingPosts.map((post, index) => (
                  <ScrollReveal
                    key={post.id}
                    delay={(index % 2) * 100}
                    className="h-full"
                  >
                    <BlogCard post={post} />
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
