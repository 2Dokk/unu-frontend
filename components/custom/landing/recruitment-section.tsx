"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock } from "lucide-react";
import { RecruitmentResponse } from "@/lib/interfaces/recruitment";
import { formatDate } from "@/lib/utils/date-utils";

interface RecruitmentSectionProps {
  recruitment: RecruitmentResponse;
}

function calculateDDay(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function RecruitmentSection({ recruitment }: RecruitmentSectionProps) {
  const dDay = calculateDDay(recruitment.endAt);
  const startDate = formatDate(recruitment.startAt);
  const endDate = formatDate(recruitment.endAt);

  return (
    <section className="px-4 py-16 bg-primary/5 border-y">
      <div className="mx-auto max-w-6xl">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center gap-2">
              <Badge className="animate-pulse bg-primary text-primary-foreground">
                현재 모집 중
              </Badge>
              {dDay >= 0 && (
                <Badge variant="outline" className="font-semibold">
                  {dDay === 0 ? "오늘 마감" : `D-${dDay}`}
                </Badge>
              )}
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {recruitment.title} 모집 중입니다
            </h2>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                <span className="text-sm font-medium">
                  모집 기간: {startDate} ~ {endDate}
                </span>
              </div>
              {dDay >= 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {dDay === 0
                      ? "오늘이 마감일입니다"
                      : `${dDay}일 남았습니다`}
                  </span>
                </div>
              )}
            </div>

            {recruitment.description && (
              <p className="text-base text-muted-foreground leading-relaxed max-w-3xl line-clamp-3">
                {recruitment.description}
              </p>
            )}

            <div className="pt-2">
              <Button asChild size="lg" className="text-lg px-10 py-6">
                <Link href="/apply">지원하러 가기</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
