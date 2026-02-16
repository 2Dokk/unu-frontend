"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";

export function FinalCTASection() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="px-4 py-20 bg-muted/50">
      <div className="mx-auto max-w-4xl text-center space-y-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          지금 바로 CNU 학회와 함께하세요
        </h2>
        <p className="text-lg text-muted-foreground">
          열정과 도전정신을 가진 여러분을 기다립니다.
          <br />
          함께 성장하고, 함께 만들어가는 CNU 학회의 일원이 되어보세요.
        </p>
        <Button asChild size="lg" className="text-lg px-12 py-6">
          <Link href={isAuthenticated ? "/login" : "/apply"}>
            {isAuthenticated ? "로그인하러 가기" : "지원하러 가기"}
          </Link>
        </Button>
      </div>
    </section>
  );
}
