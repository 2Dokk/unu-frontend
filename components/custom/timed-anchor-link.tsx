"use client";

import { MouseEvent, ReactNode, useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const PENDING_SCROLL_KEY = "cnu-pending-scroll";

interface TimedAnchorLinkProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  href?: string;
  offset?: number;
  targetId: string;
}

export function TimedAnchorLink({
  children,
  className,
  duration = 900,
  href,
  offset = 64,
  targetId,
}: TimedAnchorLinkProps) {
  const pathname = usePathname();
  const router = useRouter();
  const animationFrame = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (animationFrame.current !== null) {
        cancelAnimationFrame(animationFrame.current);
      }
    },
    [],
  );

  const scrollToTarget = useCallback(() => {
    const target = document.getElementById(targetId);
    if (!target) return false;

    if (animationFrame.current !== null) {
      cancelAnimationFrame(animationFrame.current);
    }

    const startY = window.scrollY;
    const targetY = target.getBoundingClientRect().top + startY - offset;
    const distance = targetY - startY;

    window.history.pushState(null, "", `#${targetId}`);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo({ top: targetY, behavior: "instant" });
      return true;
    }

    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      window.scrollTo({
        top: startY + distance * easedProgress,
        behavior: "instant",
      });

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        animationFrame.current = null;
      }
    };

    animationFrame.current = requestAnimationFrame(animate);
    return true;
  }, [duration, offset, targetId]);

  useEffect(() => {
    if (sessionStorage.getItem(PENDING_SCROLL_KEY) !== targetId) return;

    const frame = requestAnimationFrame(() => {
      if (scrollToTarget()) {
        sessionStorage.removeItem(PENDING_SCROLL_KEY);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname, scrollToTarget, targetId]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (scrollToTarget()) return;

    if (href) {
      sessionStorage.setItem(PENDING_SCROLL_KEY, targetId);
      router.push(href.split("#")[0] || "/");
    }
  };

  return (
    <a
      href={href ?? `#${targetId}`}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
