import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getActiveRecruitment } from "@/lib/api/recruitment";
import { formatDate } from "@/lib/utils/date-utils";
import { CalendarDays, ArrowRight, Code2, Users, Rocket } from "lucide-react";

async function getRecruitment() {
  try {
    const recruitment = await getActiveRecruitment();
    return recruitment;
  } catch (error) {
    return null;
  }
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

export default async function Home() {
  const activeRecruitment = await getRecruitment();
  const dDay = activeRecruitment?.startAt
    ? calculateDDay(activeRecruitment.endAt)
    : null;

  return (
    <div className="flex flex-col">
      {/* Section 1: Hero */}
      <section className="flex min-h-screen items-center justify-center px-4 py-20">
        <div className="mx-auto w-full max-w-5xl text-center space-y-8">
          {/* Small heading */}
          <p className="text-sm text-muted-foreground font-medium tracking-wide">
            Sogang University Computer Club
          </p>

          {/* Main title */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-tight">CNU</h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            웹 개발을 중심으로 함께 성장하는 컴퓨터학회
          </p>

          {/* Recruitment Block */}
          <div className="pt-8">
            {activeRecruitment ? (
              <div className="space-y-6">
                <Badge
                  variant="default"
                  className="px-4 py-1.5 text-sm font-medium"
                >
                  현재 모집 중
                </Badge>

                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-semibold">
                    {activeRecruitment.title}
                  </h2>

                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-sm">
                      {formatDate(activeRecruitment.startAt)} -{" "}
                      {formatDate(activeRecruitment.endAt)}
                    </span>
                    {dDay !== null && dDay >= 0 && (
                      <Badge variant="secondary" className="ml-2">
                        D-{dDay}
                      </Badge>
                    )}
                  </div>
                </div>

                <Link href="/apply">
                  <Button size="lg" className="gap-2 text-base px-8">
                    지원하러 가기
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-lg text-muted-foreground">
                다음 모집을 준비 중입니다.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: About CNU */}
      <section className="bg-muted/30 px-4 py-20 md:py-32">
        <div className="mx-auto w-full max-w-5xl space-y-16">
          {/* Title and description */}
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold">
              CNU는 어떤 곳인가요?
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              CNU는 웹 개발을 중심으로 활동하는 컴퓨터학회입니다. 스터디와
              프로젝트를 통해 실전 개발 역량을 키우고, 함께 협업하며 성장하는
              경험을 제공합니다.
            </p>
          </div>

          {/* Feature blocks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-border/50 hover:border-border transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code2 className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Web Study</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    웹 기술 중심 스터디
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-border/50 hover:border-border transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Team Projects</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    실전 프로젝트 경험
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-border/50 hover:border-border transition-colors">
              <CardContent className="pt-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Community</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    개발자 네트워크와 협업 문화
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
