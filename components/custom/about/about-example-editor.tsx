"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AboutSectionInfo } from "@/lib/about-sections";
import {
  createAboutExample,
  updateAboutExample,
} from "@/lib/api/about-example";
import { deleteImage, uploadImage } from "@/lib/api/image";
import { AboutExample } from "@/lib/interfaces/about-example";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/contexts/AuthContext";

interface AboutExampleEditorProps {
  section: AboutSectionInfo;
  example?: AboutExample;
}

function errorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const message = error.response?.data;
  return typeof message === "string" && message.trim() ? message : fallback;
}

export function AboutExampleEditor({
  section,
  example,
}: AboutExampleEditorProps) {
  const router = useRouter();
  const { hasRole, isLoading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingImageIdRef = useRef<string | null>(null);
  const savedRef = useRef(false);
  const [title, setTitle] = useState(example?.title ?? "");
  const [description, setDescription] = useState(example?.description ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(
    example?.thumbnailUrl ?? "",
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canManage = hasRole("MANAGER");
  const detailPath = `/about/${section.slug}`;

  useEffect(() => {
    if (authLoading || canManage) return;
    router.replace(detailPath);
  }, [authLoading, canManage, detailPath, router]);

  useEffect(() => {
    return () => {
      const pendingId = pendingImageIdRef.current;
      if (!savedRef.current && pendingId) {
        void deleteImage(pendingId).catch(() => {});
      }
    };
  }, []);

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일을 선택해 주세요.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("이미지는 10MB 이하만 업로드할 수 있습니다.");
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadImage(file);
      const previousPendingId = pendingImageIdRef.current;
      pendingImageIdRef.current = uploaded.id;
      setThumbnailUrl(uploaded.url);
      if (previousPendingId) {
        void deleteImage(previousPendingId).catch(() => {});
      }
    } catch (error) {
      toast.error(errorMessage(error, "이미지를 업로드하지 못했습니다."));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("제목을 입력해 주세요.");
      return;
    }
    if (!description.trim()) {
      toast.error("설명을 입력해 주세요.");
      return;
    }
    if (!thumbnailUrl) {
      toast.error("대표 이미지를 등록해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        category: section.category,
        title: title.trim(),
        description: description.trim(),
        thumbnailUrl,
      };
      if (example) {
        await updateAboutExample(example.id, data);
        toast.success("소개 글을 수정했습니다.");
      } else {
        await createAboutExample(data);
        toast.success("소개 글을 등록했습니다.");
      }
      savedRef.current = true;
      pendingImageIdRef.current = null;
      router.push(detailPath);
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error, "소개 글을 저장하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !canManage) return null;

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-white text-[#14231b]">
      <div className="mx-auto w-full max-w-3xl px-6 py-10 sm:py-14">
        <Link
          href={detailPath}
          className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-[#14231b]/60 transition-colors hover:text-[#14231b]"
        >
          <ArrowLeft className="size-4" />
          {section.title}으로 돌아가기
        </Link>

        <div className="mb-9 border-b border-[#14231b]/15 pb-7">
          <p className="text-sm font-semibold text-[#40795b]">
            {section.groupTitle}
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            {example ? "소개 글 수정" : "소개 글 작성"}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="space-y-2">
            <label htmlFor="about-example-title" className="text-sm font-bold">
              제목
            </label>
            <Input
              id="about-example-title"
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="활동이나 지원 사례의 제목을 입력해 주세요."
              className="h-11 text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold">대표 이미지</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleImageChange}
            />
            {thumbnailUrl ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative block aspect-[16/9] w-full overflow-hidden rounded-md border border-[#14231b]/15 bg-[#f4f6f4] text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailUrl}
                  alt="대표 이미지 미리보기"
                  className="size-full object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-sm font-semibold text-white opacity-0 transition-all group-hover:bg-black/35 group-hover:opacity-100">
                  이미지 변경
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-[16/7] w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[#14231b]/25 bg-[#f7f9f7] text-[#14231b]/55 transition-colors hover:border-[#40795b] hover:text-[#40795b]"
              >
                <ImagePlus className="size-6" />
                <span className="text-sm font-semibold">
                  {uploading ? "업로드 중..." : "대표 이미지 선택"}
                </span>
              </button>
            )}
            <p className="text-xs text-[#14231b]/50">
              JPG, PNG, WebP, GIF 형식의 10MB 이하 이미지를 등록할 수 있습니다.
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="about-example-description"
              className="text-sm font-bold"
            >
              설명
            </label>
            <Textarea
              id="about-example-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="무엇을 진행했는지와 주요 결과를 간결하게 소개해 주세요."
              className="min-h-48 resize-y px-4 py-3 text-sm leading-7"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-[#14231b]/15 pt-6">
            <Button type="button" variant="outline" asChild>
              <Link href={detailPath}>취소</Link>
            </Button>
            <Button
              type="submit"
              disabled={uploading || submitting}
              className="bg-[#14231b] text-white hover:bg-[#244333]"
            >
              <Upload className="size-4" />
              {submitting ? "저장 중..." : example ? "수정" : "등록"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
