"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBlogPosts } from "@/lib/api/blog";
import { BlogPost, BlogCategory } from "@/lib/interfaces/blog";
import { BlogCard } from "@/components/custom/blog/blog-card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";
import { cn } from "@/lib/utils";

type Filter = "all" | BlogCategory;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "See All" },
  { value: "tech", label: "Tech" },
  { value: "essay", label: "Essay" },
];

export default function BlogPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Filter>("all");

  useEffect(() => {
    setLoading(true);
    getBlogPosts(active === "all" ? undefined : active)
      .then((res) => setPosts(res.posts))
      .finally(() => setLoading(false));
  }, [active]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Blog</h1>
          <p className="text-muted-foreground text-sm">
            CNU 멤버들이 쓴 기술 글과 에세이를 모았습니다.
          </p>
        </div>
        {isAuthenticated && (
          <Button size="sm" onClick={() => router.push("/blog/create")}>
            글 작성
          </Button>
        )}
      </div>

      {/* Filter badges */}
      <div className="flex gap-2">
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActive(value)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              active === value
                ? "bg-muted text-foreground"
                : "bg-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Post list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 py-4 border-b">
              <div className="w-36 h-24 rounded-lg bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-full" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          게시글이 없습니다.
        </p>
      ) : (
        <div>
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </main>
  );
}
