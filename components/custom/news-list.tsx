"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Notice } from "@/lib/interfaces/notice";
import { formatDotDate } from "@/lib/utils/date-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function NewsList({ notices }: { notices: Notice[] }) {
  const [selected, setSelected] = useState<Notice | null>(null);

  if (notices.length === 0) {
    return (
      <div className="mx-auto mt-10 w-[90%] max-w-[1045px] overflow-hidden rounded-[26px] bg-white/50 py-12 text-center text-[#929191] shadow-[0_1px_73px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        등록된 소식이 없습니다.
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto mt-10 w-[90%] max-w-[1045px] overflow-hidden rounded-[26px] bg-white/50 shadow-[0_1px_73px_rgba(0,0,0,0.25)] backdrop-blur-xl">
        {notices.map((notice) => (
          <button
            key={notice.id}
            onClick={() => setSelected(notice)}
            className="group relative grid min-h-[77px] w-full cursor-pointer grid-cols-[59px_minmax(0,1fr)_20px] items-center gap-3.5 border-b border-[#d8d8d8] px-4 text-left transition-colors last:border-b-0 hover:bg-[#37825d]/[0.06] sm:min-h-[89px] sm:grid-cols-[81px_minmax(0,1fr)_178px_20px] sm:gap-8 sm:px-[41px]"
          >
            <span className="flex h-9 items-center justify-center rounded-full bg-[#37825d] text-xs text-white sm:h-[37px] sm:text-lg">
              {notice.tag}
            </span>
            <span className="truncate text-sm transition-colors sm:text-xl group-hover:text-[#215a3f]">
              {notice.title}
            </span>
            <span className="hidden text-center text-xl text-[#929191] sm:block sm:translate-x-10">
              {formatDotDate(notice.createdAt)}
            </span>
            <ChevronRight className="h-4 w-4 -translate-x-1 text-[#37825d] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
            <DialogDescription>
              {selected?.tag} · {selected ? formatDotDate(selected.createdAt) : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-line text-sm leading-relaxed text-[#3a4050]">
            {selected?.content}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
