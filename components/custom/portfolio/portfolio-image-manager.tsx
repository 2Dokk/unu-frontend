"use client";

import { useCallback, useRef, useState } from "react";
import { ImageIcon, X, Star, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/api/image";
import { cn } from "@/lib/utils";

interface PortfolioImageManagerProps {
  images: string[];
  thumbnailUrl: string;
  onAdd: (url: string) => void;
  onRemove: (url: string) => void;
  onSelectThumbnail: (url: string) => void;
}

export function PortfolioImageManager({
  images,
  thumbnailUrl,
  onAdd,
  onRemove,
  onSelectThumbnail,
}: PortfolioImageManagerProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      try {
        for (const file of Array.from(files)) {
          if (!file.type.startsWith("image/")) continue;
          const url = await uploadImage(file);
          onAdd(url);
        }
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [onAdd],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles],
  );

  return (
    <div className="space-y-3">
      {/* Drop / click zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl px-6 py-8 flex flex-col items-center gap-2 transition-colors",
          uploading ? "cursor-default" : "cursor-pointer",
          dragging
            ? "border-primary bg-primary/5"
            : "border-muted hover:border-muted-foreground/40",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="h-7 w-7 text-muted-foreground animate-spin" />
        ) : (
          <ImageIcon className="h-7 w-7 text-muted-foreground" />
        )}
        <p className="text-sm text-muted-foreground text-center">
          {uploading
            ? "업로드 중…"
            : "이미지를 드래그하거나 클릭해서 업로드 (여러 장 가능)"}
        </p>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            대표 이미지로 사용할 이미지를 클릭해서 선택하세요
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {images.map((url) => {
              const isSelected = thumbnailUrl === url;
              return (
                <div key={url} className="relative aspect-square group">
                  <button
                    type="button"
                    onClick={() => onSelectThumbnail(url)}
                    className={cn(
                      "w-full h-full rounded-lg overflow-hidden border-2 transition-all",
                      isSelected
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/40",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {/* Thumbnail badge */}
                  {isSelected && (
                    <div className="absolute top-1 left-1 bg-primary rounded-full p-0.5 pointer-events-none">
                      <Star className="h-2.5 w-2.5 fill-white text-white" />
                    </div>
                  )}

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onRemove(url); }}
                    className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2.5 w-2.5 text-white" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
