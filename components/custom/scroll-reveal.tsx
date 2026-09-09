"use client";

import { ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = ComponentPropsWithoutRef<"div"> & {
  delay?: number;
  distance?: number;
  eager?: boolean;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  distance = 24,
  eager = false,
  style,
  ...props
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (
      eager ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const frame = window.requestAnimationFrame(() => setRevealed(true));
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setRevealed(true);
        observer.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
        className,
      )}
      style={{
        ...style,
        opacity: revealed ? 1 : 0,
        transform: revealed ? "none" : `translateY(${distance}px)`,
        transitionDelay: revealed ? `${delay}ms` : "0ms",
      }}
      {...props}
    >
      {children}
    </div>
  );
}
