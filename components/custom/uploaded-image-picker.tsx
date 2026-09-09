"use client";

import { Check } from "lucide-react";

interface UploadedImagePickerProps {
  images: { id: string; url: string }[];
  selectedUrl: string;
  onSelect: (url: string) => void;
}

export function UploadedImagePicker({ images, selectedUrl, onSelect }: UploadedImagePickerProps) {
  if (images.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        에디터에서 이미지를 붙여넣거나 드래그하면 여기에 표시됩니다.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-muted-foreground">클릭하여 대표 이미지를 선택하세요. (미선택 시 첫 번째 이미지가 자동 사용됩니다)</p>
      <div className="flex flex-wrap gap-2">
        {images.map(({ id, url }) => {
          const selected = selectedUrl === url;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(selected ? "" : url)}
              className={`relative h-16 w-16 rounded-md overflow-hidden border-2 transition-colors ${
                selected ? "border-foreground" : "border-transparent hover:border-border"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              {selected && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
