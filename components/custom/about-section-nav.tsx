"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { id: "activity", label: "활동" },
  { id: "support", label: "지원" },
  { id: "executives", label: "역대 운영진" },
] as const;

type SectionId = (typeof ITEMS)[number]["id"];

export function AboutSectionNav() {
  const [activeSection, setActiveSection] = useState<SectionId>("activity");
  const [previewSection, setPreviewSection] = useState<SectionId | null>(null);
  const navigationTargetRef = useRef<SectionId | null>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const navigationTarget = navigationTargetRef.current;

        if (navigationTarget) {
          const reachedTarget = entries.some(
            (entry) =>
              entry.isIntersecting && entry.target.id === navigationTarget,
          );

          if (reachedTarget) {
            navigationTargetRef.current = null;
            if (navigationTimerRef.current) {
              clearTimeout(navigationTimerRef.current);
              navigationTimerRef.current = null;
            }
          }

          return;
        }

        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (first, second) =>
              first.boundingClientRect.top - second.boundingClientRect.top,
          )[0];

        if (visibleSection?.target.id) {
          setActiveSection(visibleSection.target.id as SectionId);
        }
      },
      { rootMargin: "-18% 0px -68% 0px" },
    );

    ITEMS.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    return () => {
      observer.disconnect();
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
      }
    };
  }, []);

  const handleNavigate = (sectionId: SectionId) => {
    navigationTargetRef.current = sectionId;
    setActiveSection(sectionId);

    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
    }

    navigationTimerRef.current = setTimeout(() => {
      navigationTargetRef.current = null;
      navigationTimerRef.current = null;
    }, 1200);
  };

  return (
    <nav
      aria-label="소개 페이지 목차"
      className="flex gap-7 overflow-x-auto pb-2 lg:sticky lg:top-28 lg:flex-col lg:gap-[73px] lg:overflow-visible lg:pb-0"
    >
      {ITEMS.map((item) => {
        const active = activeSection === item.id;
        const emphasized = (previewSection ?? activeSection) === item.id;

        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-current={active ? "location" : undefined}
            onClick={() => handleNavigate(item.id)}
            onMouseEnter={() => setPreviewSection(item.id)}
            onMouseLeave={() => setPreviewSection(null)}
            onFocus={() => setPreviewSection(item.id)}
            onBlur={() => setPreviewSection(null)}
            className={cn(
              "group flex shrink-0 items-center gap-5 leading-8 tracking-[0] transition-colors duration-300 lg:gap-[25px] lg:text-[20px]",
              emphasized
                ? "font-medium text-[#14231b]"
                : "font-normal text-[#14231b]/40",
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "h-px origin-left bg-current transition-[width,opacity] duration-300 ease-out",
                emphasized
                  ? "w-12 opacity-100 lg:w-[107px]"
                  : "w-6 opacity-60 lg:w-12",
              )}
            />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
