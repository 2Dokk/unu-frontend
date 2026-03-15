"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getFormById } from "@/lib/api/form";
import { FormResponse } from "@/lib/interfaces/form";

export default function FormViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [form, setForm] = useState<FormResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFormById(id)
      .then(setForm)
      .catch((error: any) => console.error("Failed to load form:", error))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-8 text-center">
        <p className="text-muted-foreground">신청서를 찾을 수 없습니다</p>
        <Button className="mt-4" onClick={() => router.back()}>
          돌아가기
        </Button>
      </div>
    );
  }

  const now = new Date();
  const isBeforeStart = form.startAt ? now < new Date(form.startAt) : false;
  const isAfterEnd = form.endAt ? now > new Date(form.endAt) : false;
  const isOutOfPeriod = (form.startAt || form.endAt) && (isBeforeStart || isAfterEnd);

  const periodMessage = isBeforeStart
    ? `신청 기간이 아직 시작되지 않았습니다`
    : isAfterEnd
      ? `신청 기간이 종료되었습니다`
      : null;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      <Card>
        <CardContent className="pt-6 pb-6 space-y-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{form.title}</h1>
            {form.description && (
              <>
                <Separator />
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {form.description.split(/(\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
                    const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
                    if (match) {
                      return (
                        <a
                          key={i}
                          href={match[2]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2 hover:opacity-80"
                        >
                          {match[1]}
                        </a>
                      );
                    }
                    return part;
                  })}
                </p>
              </>
            )}
          </div>

          {periodMessage && (
            <p className="text-sm text-muted-foreground text-center">
              {periodMessage}
            </p>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!!isOutOfPeriod}
            onClick={() => router.push(`/forms/${id}/submit`)}
          >
            <PenLine className="mr-2 h-4 w-4" />
            신청하기
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
