"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";
import { ArrowDown } from "lucide-react";

interface HeroSectionProps {
  hasActiveRecruitment?: boolean;
}

export function HeroSection({ hasActiveRecruitment }: HeroSectionProps) {
  const { isAuthenticated } = useAuth();

  const scrollToAbout = () => {
    document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative flex min-h-[90vh] items-center justify-center px-4 py-20">
      <div className="mx-auto max-w-6xl text-center space-y-8">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
          CNU 학회에 오신 것을
          <br />
          <span className="text-primary">환영합니다</span>
        </h1>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          {!hasActiveRecruitment && (
            <Button asChild size="lg" className="text-lg px-8 py-6">
              <Link href={isAuthenticated ? "/login" : "/apply"}>
                {isAuthenticated ? "로그인하러 가기" : "지원하러 가기"}
              </Link>
            </Button>
          )}

          <Button
            variant={hasActiveRecruitment ? "default" : "outline"}
            size="lg"
            onClick={scrollToAbout}
            className="text-lg px-8 py-6"
          >
            학회 소개 보기
            <ArrowDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
