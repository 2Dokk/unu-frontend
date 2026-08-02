import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/date-utils";
import {
  ArrowRight,
  Code2,
  Users,
  Rocket,
  Mail,
  MapPin,
} from "lucide-react";
import { getActiveRecruitment } from "@/lib/api/recruitment";
import { getCurrentQuarter } from "@/lib/api/quarter";
import { QuarterResponse } from "@/lib/interfaces/quarter";

const STATS = [
  { value: "240+", label: "누적 학회원" },
  { value: "50+", label: "완성 프로젝트" },
  { value: "60+", label: "진행한 스터디" },
  { value: "2021", label: "시작년도" },
];

const NEWS_ITEMS = [
  { tag: "모집", title: "신입 학회원 모집 ~ 9.1", date: "2026.07.22" },
  {
    tag: "활동",
    title: "OO프로젝트 결과물 활동 게시판 업로드",
    date: "2026.07.22",
  },
  { tag: "행사", title: "06.24 종강총회", date: "2026.07.22" },
  { tag: "안내", title: "공모전 안내", date: "2026.07.22" },
];

function calculateDDay(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function formatQuarterLabel(quarter: QuarterResponse): string {
  return `${String(quarter.year).slice(2)} ${quarter.season.toUpperCase()}`;
}

async function RecruitmentCTA() {
  const [activeRecruitment, currentQuarter] = await Promise.all([
    getActiveRecruitment().catch(() => null),
    getCurrentQuarter().catch(() => null),
  ]);

  const dDay = activeRecruitment
    ? calculateDDay(activeRecruitment.endAt)
    : null;
  const quarterLabel = currentQuarter
    ? formatQuarterLabel(currentQuarter)
    : null;

  return (
    <div className="space-y-6 text-center">
      <Badge className="border border-emerald-400/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/10">
        {activeRecruitment
          ? "현재 모집 중"
          : quarterLabel
            ? `지금은 모집 기간이 아니에요 · 다음 모집 ${quarterLabel}`
            : "지금은 모집 기간이 아니에요 · 다음 모집 준비 중"}
      </Badge>

      <h2 className="text-3xl md:text-5xl font-bold leading-tight text-white">
        함께할 분들을
        <br />
        기다리고 있어요.
      </h2>

      <p className="text-base text-emerald-100/70 md:text-lg">
        {activeRecruitment ? (
          <>
            {formatDate(activeRecruitment.startAt)} -{" "}
            {formatDate(activeRecruitment.endAt)} 지원을 받고 있습니다.
            {dDay !== null && dDay >= 0 && (
              <span className="ml-2 font-medium text-emerald-300">
                D-{dDay}
              </span>
            )}
          </>
        ) : quarterLabel ? (
          `${quarterLabel} 분기 CNU 모집이 곧 시작될 예정입니다.`
        ) : (
          "다음 모집이 시작되면 가장 먼저 알려드릴게요."
        )}
      </p>

      <Link href="/apply">
        <Button
          size="lg"
          className="gap-2 bg-white px-8 text-base text-emerald-900 hover:bg-emerald-50"
        >
          {activeRecruitment ? "지원하러 가기" : "모집 공고 확인하기"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}

function RecruitmentCTASkeleton() {
  return <Skeleton className="mx-auto h-10 w-48 rounded-md bg-white/10" />;
}

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Section 1: Hero */}
      <section className="px-4 pb-16 pt-24 md:pb-24 md:pt-32">
        <div className="mx-auto w-full max-w-5xl space-y-10 text-center">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 md:text-sm">
              Web Development &amp; Software System Community
            </p>

            <h1 className="text-6xl font-bold tracking-tight md:text-8xl">
              CNU
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              웹과 시스템을 중심으로 함께 성장하는 컴퓨터학회입니다.
            </p>

            <Link href="/apply">
              <Button variant="outline" className="rounded-full px-6">
                지원 안내
              </Button>
            </Link>
          </div>

          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-8 pt-4 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="space-y-1">
                <p className="text-3xl font-bold md:text-4xl">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 2: About CNU */}
      <section className="bg-muted/30 px-4 py-20 md:py-32">
        <div className="mx-auto w-full max-w-5xl space-y-16">
          {/* Title and description */}
          <div className="mx-auto max-w-3xl space-y-6 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              CNU는 어떤 곳인가요?
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              CNU는 웹 개발과 소프트웨어 시스템 기술을 중심으로 활동하는
              학회입니다. 스터디와 프로젝트를 통해 실전 역량을 키우고, 함께
              협업하며 성장하는 경험을 제공합니다.
            </p>
          </div>

          {/* Feature blocks */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Feature 1 */}
            <Card className="border-border/50 transition-colors hover:border-border">
              <CardContent className="space-y-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Code2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Study</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    웹과 시스템 중심 스터디
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-border/50 transition-colors hover:border-border">
              <CardContent className="space-y-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Rocket className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Team Projects</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    실전 프로젝트 경험
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-border/50 transition-colors hover:border-border">
              <CardContent className="space-y-4 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Community</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    개발자 네트워크와 협업 문화
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Section 3: 학회 소식 */}
      <section className="px-4 py-20 md:py-32">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <h2 className="text-2xl font-bold md:text-3xl">학회 소식</h2>

          <Card className="border-border/50 py-0">
            <CardContent className="divide-y divide-border/50 p-0">
              {NEWS_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <Badge className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-600">
                    {item.tag}
                  </Badge>
                  <p className="flex-1 truncate text-sm md:text-base">
                    {item.title}
                  </p>
                  <p className="shrink-0 text-sm text-muted-foreground">
                    {item.date}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Section 4: Portfolio teaser */}
      <Link
        href="/portfolio"
        className="group block border-t border-border px-4 py-16 transition-colors hover:bg-muted/30 md:py-20"
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold md:text-3xl">
                지금까지의 작업
              </h2>
              <ArrowRight className="h-5 w-5 text-emerald-600 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="text-muted-foreground">
              CNU가 만들어온 활동을 소개합니다.
            </p>
          </div>
          <span className="hidden select-none text-5xl font-bold text-muted-foreground/20 sm:block md:text-7xl">
            portfolio
          </span>
        </div>
      </Link>

      {/* Section 5: Blog teaser */}
      <Link
        href="/blog"
        className="group block border-t border-border px-4 py-16 transition-colors hover:bg-muted/30 md:py-20"
      >
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold md:text-3xl">
                남겨온 이야기
              </h2>
              <ArrowRight className="h-5 w-5 text-emerald-600 transition-transform group-hover:translate-x-1" />
            </div>
            <p className="text-muted-foreground">
              기술과 경험, 그리고 생각을 나눕니다.
            </p>
          </div>
          <span className="hidden select-none text-5xl font-bold text-muted-foreground/20 sm:block md:text-7xl">
            blog
          </span>
        </div>
      </Link>

      {/* Section 6: Recruitment CTA */}
      <section className="border-t border-border bg-[#0b1f16] px-4 py-20 md:py-28">
        <div className="mx-auto w-full max-w-3xl">
          <Suspense fallback={<RecruitmentCTASkeleton />}>
            <RecruitmentCTA />
          </Suspense>
        </div>
      </section>

      {/* Section 7: Contact */}
      <section className="px-4 py-20 md:py-32">
        <div className="mx-auto w-full max-w-5xl space-y-16">
          <div className="space-y-5">
            <h2 className="text-3xl font-bold md:text-4xl">Contact</h2>
            <p className="leading-relaxed text-muted-foreground">
              CNU의 모든 공식 문의는 이메일을 통해 받고 있습니다.
              <br />
              활동, 모집, 프로젝트, 협업과 관련해 궁금한 점이 있다면
              admin@cnu.team으로 연락해 주세요.
            </p>
            <a href="mailto:admin@cnu.team">
              <Button variant="outline" className="gap-2 rounded-full">
                <Mail className="h-4 w-4" />
                메일로 문의하기
              </Button>
            </a>
          </div>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-xl font-semibold">
              <MapPin className="h-5 w-5 text-emerald-600" />
              랩실 위치
            </h3>
            <p className="text-muted-foreground">
              CNU의 랩실은 서강대학교 리치과학관에 위치하고 있습니다.
            </p>
            <div className="relative h-64 overflow-hidden rounded-lg border border-border/50 md:h-80">
              <Image
                src="/map.png"
                alt="CNU 랩실 위치 지도"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
