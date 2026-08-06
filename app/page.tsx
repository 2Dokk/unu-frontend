import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Code2, Rocket, Users } from "lucide-react";
import { formatDate } from "@/lib/utils/date-utils";
import { getActiveRecruitment } from "@/lib/api/recruitment";
import { getCurrentQuarter } from "@/lib/api/quarter";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { TimedAnchorLink } from "@/components/custom/timed-anchor-link";

const STATS = [
  { value: "240+", label: "누적 학회원" },
  { value: "50+", label: "완성 프로젝트" },
  { value: "60+", label: "진행한 스터디" },
  { value: "2021", label: "시작년도" },
];

const FEATURES = [
  { title: "Study", description: "웹과 시스템 중심 스터디", Icon: Code2 },
  { title: "Team Projects", description: "실전 프로젝트 경험", Icon: Rocket },
  { title: "Community", description: "개발자 네트워크와 협업 문화", Icon: Users },
];

const NEWS_ITEMS = [
  { tag: "행사", title: "[08.29] CNU 선배와의 만남", date: "2026.08.18" },
  {
    tag: "활동",
    title: "[07.13 ~] 26 Summer 활동 시작 ",
    date: "2026.07.13",
  },
  { tag: "모집", title: "26 Summer 신입 학회원 모집 [~ 06.30]", date: "2026.06.25" },
  { tag: "행사", title: "[06.24] 26 Spring 종강총회", date: "2026.06.24" }
];

function calculateDDay(endDate: string): number {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - today.getTime()) / 86_400_000);
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
    <div className="font-cnu-body flex flex-col items-center px-5 text-center text-white">
      <div className="flex min-h-[45px] w-full max-w-[585px] items-center justify-center rounded-full border border-[#8b8a8a] px-5 text-sm sm:text-xl">
        {activeRecruitment
          ? `현재 모집 중${dDay !== null && dDay >= 0 ? ` · D-${dDay}` : ""}`
          : quarterLabel
            ? `지금은 모집 기간이 아니에요 · 다음 모집 ${quarterLabel}`
            : "지금은 모집 기간이 아니에요 · 다음 모집 준비 중"}
      </div>

      <h2 className="font-cnu-display mt-12 text-[40px] leading-[1.06] font-bold sm:text-6xl lg:text-[83px] lg:leading-[86px]">
        함께할 분들을
        <br />
        기다리고 있어요.
      </h2>

      <p className="mt-8 text-base leading-8 sm:text-2xl">
        {activeRecruitment ? (
          <>
            {formatDate(activeRecruitment.startAt)} -{" "}
            {formatDate(activeRecruitment.endAt)} 지원을 받고 있습니다.
          </>
        ) : quarterLabel ? (
          `${quarterLabel} 분기 CNU 모집이 곧 시작될 예정입니다.`
        ) : (
          "다음 모집이 시작되면 가장 먼저 알려드릴게요."
        )}
      </p>

      <Link
        href="/apply"
        className="mt-10 flex h-[45px] w-full max-w-[391px] items-center justify-center rounded-full bg-white px-6 text-lg font-medium text-black transition-colors hover:bg-[#264638] hover:text-white sm:text-2xl"
      >
        {activeRecruitment ? "지원하러 가기" : "모집 공고 확인하기"}
      </Link>
    </div>
  );
}

function RecruitmentCTASkeleton() {
  return (
    <div className="mx-auto h-[45px] w-full max-w-[585px] animate-pulse rounded-full bg-white/10" />
  );
}

export default function Home() {
  return (
    <div
      id="home-top"
      className="font-cnu-body overflow-x-hidden bg-white text-black"
    >
      <section className="border-b border-[#dddddd]">
        <div className="relative h-[510px] overflow-hidden bg-[#14231b] lg:h-[clamp(510px,29.48vw,566px)]">
          <div className="pointer-events-none absolute inset-0">
            <Image
              src="/home-hero-figma.png"
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center"
              priority
            />
          </div>

          <div className="relative mx-auto h-full w-full max-w-[1219px] px-5 text-white sm:px-8 2xl:max-w-[1236px] 2xl:px-0">
            <div className="h-full pt-12 sm:pt-16">
              <p className="font-cnu-body text-sm font-semibold text-[#80c3a1] sm:text-2xl">
                WEB DEVELOPMENT &amp; SOFTWARE SYSTEM COMMUNITY
              </p>
              <h1 className="font-cnu-body mt-2 text-7xl leading-none font-bold tracking-[0.45px] sm:text-8xl lg:text-[115px] lg:leading-[126px]">
                CNU
              </h1>
              <p className="mt-2 max-w-[603px] text-base leading-8 text-white sm:text-2xl sm:leading-[72px]">
                <span className="text-[#2d9c64]">웹과 시스템</span>을 중심으로 함께
                성장하는 서강대학교 컴퓨터공학과 학회
              </p>
              <TimedAnchorLink
                targetId="recruit"
                duration={900}
                className="mt-4 flex h-[45px] w-[180px] items-center justify-center rounded-full border border-[#c9c9c9] bg-white text-lg font-medium text-black transition-colors hover:border-[#264638] hover:bg-[#264638] hover:text-white sm:text-2xl"
              >
                지원 안내
              </TimedAnchorLink>

              <div className="mt-12 grid max-w-[684px] grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 sm:gap-x-10">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-4xl leading-none font-medium sm:text-[50px] lg:text-[58px]">
                      {stat.value}
                    </p>
                    <p className="mt-4 text-sm font-medium sm:text-xl">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[1219px] px-5 sm:px-8">
          <div className="pt-20 text-center">
            <h2 className="font-cnu-body text-4xl font-bold text-[#020618] sm:text-5xl lg:text-[54px] lg:leading-[65px]">
              CNU는 어떤 곳인가요?
            </h2>
            <p className="mx-auto mt-7 max-w-[810px] text-base leading-relaxed text-[#62748e] sm:text-2xl sm:leading-[1.4]">
              CNU는 웹 개발과 소프트웨어 시스템 기술을 중심으로 활동하는 학회입니다.
              <br className="hidden sm:block" /> 스터디와 프로젝트를 통해 실전 역량을
              키우고, 함께 협업하며 성장하는 경험을 제공합니다.
            </p>

            <div className="mx-auto mt-16 grid max-w-[922px] gap-6 text-left md:grid-cols-3">
              {FEATURES.map(({ title, description, Icon }) => (
                <div
                  key={title}
                  className="flex min-h-[177px] flex-col justify-end rounded-[13px] border border-slate-200/50 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex size-12 items-center justify-center rounded-[9px] bg-[#0f172b]/10">
                    <Icon className="size-6 text-[#020618]" />
                  </div>
                  <h3 className="text-xl font-bold text-[#020618]">{title}</h3>
                  <p className="mt-2 text-base text-[#62748e]">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-28 pb-24 sm:pt-36 sm:pb-[119px]">
            <h2 className="mx-auto w-[90%] max-w-[1045px] text-4xl font-semibold sm:text-5xl">
              학회 소식
            </h2>
            <div className="mx-auto mt-10 w-[90%] max-w-[1045px] overflow-hidden rounded-[26px] bg-white/50 shadow-[0_1px_73px_rgba(0,0,0,0.25)] backdrop-blur-xl">
              {NEWS_ITEMS.map((item) => (
                <div
                  key={item.title}
                  className="grid min-h-[77px] grid-cols-[59px_minmax(0,1fr)] items-center gap-3.5 border-b border-[#d8d8d8] px-4 last:border-b-0 sm:min-h-[89px] sm:grid-cols-[81px_minmax(0,1fr)_178px] sm:gap-8 sm:px-[41px]"
                >
                  <span className="flex h-9 items-center justify-center rounded-full bg-[#37825d] text-xs text-white sm:h-[37px] sm:text-lg">
                    {item.tag}
                  </span>
                  <span className="truncate text-sm sm:text-xl">{item.title}</span>
                  <span className="hidden text-center text-xl text-[#929191] sm:block">
                    {item.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="recruit"
        className="flex min-h-[585px] scroll-mt-16 items-center justify-center bg-[#14231b] py-20 sm:min-h-[720px]"
      >
        <div className="w-full">
          <Suspense fallback={<RecruitmentCTASkeleton />}>
            <RecruitmentCTA />
          </Suspense>
        </div>
      </section>

      <Link
        href="/portfolio"
        className="group relative block h-[270px] overflow-hidden border-b border-[#e5e5e5] bg-white/30 transition-colors duration-300 hover:bg-[#14231b] sm:h-[450px]"
      >
        <div className="relative mx-auto h-full w-full max-w-[1062px] px-5">
          <div className="absolute top-1/2 left-5 -translate-y-1/2 sm:left-0">
            <h2 className="font-cnu-display text-4xl font-bold tracking-[-0.45px] transition-colors group-hover:text-white sm:text-[61px] sm:leading-[54px]">
              지금까지의 작업
            </h2>
            <p className="mt-4 text-base font-bold transition-colors group-hover:text-white sm:text-2xl">
              CNU가 만들어온 활동을 소개합니다.
            </p>
          </div>
          <ArrowRight className="absolute top-1/2 right-5 size-8 -translate-y-1/2 text-[#2d9c64] transition-colors group-hover:text-white sm:right-0 sm:size-10" />
          <span className="font-cnu-display absolute right-5 bottom-5 text-[65px] leading-none font-bold tracking-[-0.45px] text-[#e0e0e0] transition-colors group-hover:text-white sm:right-0 sm:bottom-4 sm:text-[162px]">
            portfolio
          </span>
        </div>
      </Link>

      <Link
        href="/blog"
        className="group relative block h-[270px] overflow-hidden border-b border-[#e5e5e5] bg-white/30 transition-colors duration-300 hover:bg-[#14231b] sm:h-[450px]"
      >
        <div className="relative mx-auto h-full w-full max-w-[1062px] px-5">
          <div className="absolute top-1/2 left-5 -translate-y-1/2 sm:left-0">
            <h2 className="font-cnu-display text-4xl font-bold tracking-[-0.45px] transition-colors group-hover:text-white sm:text-[61px] sm:leading-[54px]">
              남겨온 이야기
            </h2>
            <p className="mt-4 text-base font-bold transition-colors group-hover:text-white sm:text-2xl">
              기술과 경험, 그리고 생각을 나눕니다.
            </p>
          </div>
          <ArrowRight className="absolute top-1/2 right-5 size-8 -translate-y-1/2 text-[#2d9c64] transition-colors group-hover:text-white sm:right-0 sm:size-10" />
          <span className="font-cnu-display absolute right-5 bottom-5 text-[79px] leading-none font-bold tracking-[-0.45px] text-[#e0e0e0] transition-colors group-hover:text-white sm:right-0 sm:bottom-4 sm:text-[162px]">
            blog
          </span>
        </div>
      </Link>

      <section
        id="contact"
        className="scroll-mt-16 px-5 py-16 sm:min-h-[1350px] sm:px-8 sm:pt-[53px]"
      >
        <div className="mx-auto w-full max-w-[1062px]">
          <h2 className="font-cnu-display text-6xl leading-none font-bold tracking-[0.45px] text-[#020618] sm:text-[79px] sm:leading-[86px]">
            Contact
          </h2>
          <p className="mt-8 text-base font-medium leading-8 text-[#0b0c0c] sm:text-2xl">
            CNU의 모든 공식 문의는 이메일을 통해 받고 있습니다.
            <br />
            활동, 모집, 프로젝트, 협업과 관련해 궁금한 점이 있다면
            admin@cnu.team으로 전달해 주세요.
          </p>
          <a
            href="mailto:admin@cnu.team"
            className="mt-10 flex h-[59px] w-[234px] items-center justify-center rounded-full border border-black bg-white text-lg font-medium transition-colors hover:bg-[#1f3f2e] hover:text-white sm:w-[286px] sm:text-2xl"
          >
            메일로 문의하기
          </a>

          <h3 className="mt-11 text-3xl font-bold">랩실 위치</h3>
          <p className="mt-5 text-base font-medium leading-8 sm:text-2xl">
            CNU의 랩실 R912는 서강대학교 리치과학관 9층에 위치하고 있습니다.
          </p>
          <br></br>
          <div className="relative mx-auto mt-5 aspect-[885/679] w-full max-w-[797px] overflow-hidden">
            <Image
              src="/map.png"
              alt="CNU 랩실 위치 지도"
              fill
              sizes="(max-width: 900px) 100vw, 797px"
              className="object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
