import Image from "next/image";
import { cn } from "@/lib/utils";

interface DefaultBlogThumbnailProps {
  title: string;
  className?: string;
  titleClassName?: string;
}

export function DefaultBlogThumbnail({
  title,
  className,
  titleClassName,
}: DefaultBlogThumbnailProps) {
  return (
    <div
      className={cn(
        "relative aspect-[659/455] overflow-hidden rounded-[8px] bg-white after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-[8px] after:ring-1 after:ring-inset after:ring-[#bdbdbd]",
        className,
      )}
    >
      <p
        className={cn(
          "font-cnu-display absolute top-[11%] right-[7%] left-[7%] z-10 line-clamp-3 break-words text-xl leading-tight font-bold text-black sm:text-4xl",
          titleClassName,
        )}
      >
        {title}
      </p>
      <div className="absolute right-[6%] bottom-[7%] left-[5%] z-10 flex items-center gap-4 sm:gap-5">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-[7px] sm:size-14">
          <Image
            src="/cnu-header-logo.png"
            alt="CNU"
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>
        <span className="font-cnu-display shrink-0 text-2xl font-bold text-black sm:text-3xl">
          CNU
        </span>
        <span className="h-px min-w-0 flex-1 bg-black" aria-hidden="true" />
      </div>
    </div>
  );
}
