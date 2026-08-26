import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AboutSectionNav } from "@/components/custom/about-section-nav";
import { ScrollReveal } from "@/components/custom/scroll-reveal";
import { ABOUT_INFO_GROUPS } from "@/lib/about-sections";
import { cn } from "@/lib/utils";

const EXECUTIVES = [
  { year: "2026", president: "천우영", vicePresident: "손기령", treasurer: "홍준영" },
  { year: "2025", president: "방가연", vicePresident: "이서연", treasurer: "조윤상" },
  { year: "2024", president: "정준하", vicePresident: "이하윤", treasurer: "김태경" },
  { year: "2023", president: "정한결", vicePresident: "이소영", treasurer: "한석기" },
  { year: "2022", president: "남정연", vicePresident: "박준서", treasurer: "강승묵" },
];

const EXECUTIVE_ROLES = [
  { key: "president", label: "학회장" },
  { key: "vicePresident", label: "부학회장" },
  { key: "treasurer", label: "총무" },
] as const;

export default function AboutPage() {
  return (
    <main className="font-cnu-body min-h-[calc(100svh-4rem)] bg-white text-[#14231b]">
      <section className="relative overflow-hidden bg-[#14231b] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <ScrollReveal
            eager
            delay={120}
            distance={12}
            className="absolute top-[66px] right-[20%] hidden text-right text-[clamp(82px,7vw,128px)] leading-[0.8] font-bold text-white/[0.035] select-none xl:block"
          >
            <span className="block">Computer</span>
            <span className="mt-5 block">N Us</span>
          </ScrollReveal>
        </div>

        <div className="relative z-10 mx-auto flex min-h-[240px] w-full max-w-7xl items-center px-6 py-12 sm:min-h-[280px]">
          <section className="relative w-full">
            <ScrollReveal eager distance={18}>
              <h1 className="font-cnu-body text-[42px] leading-[1.08] font-bold tracking-[0] sm:text-6xl">
                소개
              </h1>
              <p className="mt-5 text-lg text-white/65 sm:text-xl">
                웹 개발 및 시스템을 중심으로 함께 배우고 만드는 서강대학교 컴퓨터공학과 학회 CNU입니다.
              </p>
            </ScrollReveal>
          </section>
        </div>
      </section>

      <ScrollReveal
        eager
        distance={18}
        className="mx-auto w-full max-w-[1756px] px-5 pt-9 sm:px-10 lg:pt-12 lg:pr-8 lg:pl-20 2xl:pr-0 2xl:pl-[72px]"
      >
        <div className="grid lg:grid-cols-[289px_minmax(0,1fr)] lg:gap-x-[72px]">
          <aside className="relative z-10 mb-12 lg:col-start-1 lg:mb-0">
            <AboutSectionNav />
          </aside>

          <div className="max-w-[1060px] lg:col-start-2">
            {ABOUT_INFO_GROUPS.map((group, groupIndex) => (
              <section
                key={group.id}
                id={group.id}
                className={cn(
                  "scroll-mt-24",
                  groupIndex > 0 && "mt-20 sm:mt-24 lg:mt-28",
                )}
              >
                <div className="border-b border-[#14231b]/25 py-4 sm:py-5">
                  <h2 className="text-[22px] font-bold tracking-[0] sm:text-[26px]">
                    {group.title}
                  </h2>
                </div>

                <div className="grid auto-rows-fr">
                  {group.items.map((section) => (
                    <Link
                      key={section.id}
                      id={section.id}
                      href={`/about/${section.slug}`}
                      className="group relative grid scroll-mt-24 content-center gap-y-1.5 -mx-2 rounded-md border-b border-[#14231b]/15 px-2 py-5 pr-9 transition-colors hover:bg-[#14231b]/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#40795b]/35 focus-visible:ring-inset sm:-mx-3 sm:grid-cols-[184px_minmax(0,1fr)] sm:gap-x-5 sm:gap-y-0 sm:px-3 sm:py-6 sm:pr-11 lg:grid-cols-[200px_minmax(0,1fr)]"
                    >
                      <h3 className="text-[21px] leading-7 font-bold tracking-[0] text-[#40795b] transition-transform duration-300 group-hover:translate-x-1 sm:text-[23px]">
                        {section.title}
                      </h3>
                      <p className="whitespace-pre-line break-keep text-base leading-7 font-medium text-pretty text-[#14231b]/72 sm:col-start-2 sm:text-[17px] sm:leading-7 lg:text-[18px] lg:leading-8">
                        {section.description}
                      </p>
                      <ArrowRight
                        aria-hidden="true"
                        className="absolute top-1/2 right-2 size-[18px] -translate-y-1/2 text-[#40795b]/55 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#40795b] sm:right-3"
                      />
                    </Link>
                  ))}
                </div>
              </section>
            ))}

            <section
              id="executives"
              className="mt-20 scroll-mt-24 pb-28 sm:mt-24 sm:pb-36 lg:mt-28 lg:pb-44"
            >
              <div className="border-b border-[#14231b]/25 py-4 sm:py-5">
                <h2 className="text-[22px] font-bold tracking-[0] sm:text-[26px]">
                  역대 운영진
                </h2>
              </div>

              <div>
                <div className="hidden grid-cols-[110px_repeat(3,minmax(0,1fr))] gap-x-6 border-b border-[#14231b]/15 py-4 text-[15px] font-semibold text-[#14231b]/60 sm:grid">
                  <span>연도</span>
                  {EXECUTIVE_ROLES.map((role) => (
                    <span key={role.key}>{role.label}</span>
                  ))}
                </div>

                {EXECUTIVES.map((executive) => (
                  <div
                    key={executive.year}
                    className="grid grid-cols-3 gap-x-3 gap-y-4 border-b border-[#14231b]/15 py-5 sm:grid-cols-[110px_repeat(3,minmax(0,1fr))] sm:gap-x-6 sm:py-6"
                  >
                    <p className="col-span-3 text-xl font-bold tabular-nums sm:col-span-1 sm:text-[21px]">
                      {executive.year}
                    </p>
                    {EXECUTIVE_ROLES.map((role) => (
                      <div key={role.key} className="min-w-0">
                        <p className="mb-1 text-[13px] font-semibold text-[#14231b]/55 sm:hidden">
                          {role.label}
                        </p>
                        <p className="text-[17px] font-semibold sm:text-[19px]">
                          {executive[role.key]}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </ScrollReveal>
    </main>
  );
}
