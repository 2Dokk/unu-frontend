import { AboutSectionNav } from "@/components/custom/about-section-nav";
import { ScrollReveal } from "@/components/custom/scroll-reveal";
import { cn } from "@/lib/utils";

const ACTIVITY_SECTIONS = [
  {
    id: "lectures",
    title: "강의",
    description:
      "웹 개발과 컴퓨터 시스템을 비롯한 다양한 주제의 강의를 진행합니다. \n학회원들이 새로운 기술과 개념을 접하고, 실제 개발에 활용할 수 있는 기반을 쌓을 수 있도록 강의를 구성합니다.",
  },
  {
    id: "studies",
    title: "스터디",
    description:
      "관심 있는 기술과 주제를 중심으로 학회원들이 직접 스터디를 구성하고 운영합니다. \n정기적인 학습과 자료 공유를 통해 함께 지식을 쌓고, 관심 분야를 보다 깊이 탐구할 수 있는 환경을 마련합니다.",
  },
  {
    id: "projects",
    title: "프로젝트",
    description:
      "아이디어를 실제 서비스로 구현할 수 있도록 팀 프로젝트와 개인 프로젝트를 진행합니다. \n기획부터 개발, 배포까지의 과정을 직접 경험하며 개발 역량을 쌓을 수 있도록 지원합니다.",
  },
  {
    id: "mentoring",
    title: "멘토링",
    description:
      "프로젝트의 기획과 개발 과정에 도움이 될 수 있는 조언과 피드백을 제공합니다. \nSW 마에스트로, 기업 인턴십 등 다양한 대외 개발·커리어 프로그램을 준비하는 학회원들을 위해 관련 경험과 정보도 함께 공유합니다.",
  },
  {
    id: "networking",
    title: "네트워킹",
    description:
      "현업에서 활동하고 있는 선배 개발자와 다양한 분야의 실무자를 만날 수 있는 자리를 마련합니다. \n직무와 진로, 취업 준비 과정과 현업 경험을 직접 나누며 학회원들의 진로 탐색을 지원합니다.",
  },
];

const SUPPORT_SECTIONS = [
  {
    id: "development-support",
    title: "개발 활동 지원",
    description:
      "학회원이 개발 활동에 집중할 수 있도록 필요한 비용을 지원합니다. \n프로젝트 운영, 개발 도구 및 서비스 이용 등 실제 개발 과정에서 발생하는 부담을 줄이고 지속적인 활동을 돕습니다.",
  },
  {
    id: "competitions",
    title: "대회 및 공모전 지원",
    description:
      "대회와 공모전에 도전하는 학회원들의 팀 구성과 참가 활동을 지원합니다. \n프로젝트의 준비와 개발, 참가 과정에서 필요한 비용을 지원하여 학회원들이 외부 무대에서 경험을 쌓을 수 있도록 합니다.",
  },
];

const INFO_GROUPS = [
  { id: "activity", title: "주요 활동", items: ACTIVITY_SECTIONS },
  { id: "support", title: "지원", items: SUPPORT_SECTIONS },
] as const;

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
        <div className="grid lg:grid-cols-[289px_minmax(0,1fr)] lg:gap-x-[106px]">
          <aside className="relative z-10 mb-12 lg:col-start-1 lg:mb-0">
            <AboutSectionNav />
          </aside>

          <div className="max-w-[1060px] lg:col-start-2">
            {INFO_GROUPS.map((group, groupIndex) => (
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

                {group.items.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className="grid scroll-mt-24 gap-y-2 border-b border-[#14231b]/15 py-6 sm:grid-cols-[210px_minmax(0,1fr)] sm:gap-x-5 sm:gap-y-0 sm:py-7 lg:grid-cols-[230px_minmax(0,1fr)] lg:py-8"
                  >
                    <h3 className="text-[21px] leading-7 font-bold tracking-[0] text-[#40795b] sm:text-[23px]">
                      {section.title}
                    </h3>
                    <p className="whitespace-pre-line text-base leading-7 font-medium text-[#14231b]/72 sm:col-start-2 sm:text-[17px] sm:leading-7 lg:text-[18px] lg:leading-8">
                      {section.description}
                    </p>
                  </section>
                ))}
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
