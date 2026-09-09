"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { AboutExampleEditor } from "@/components/custom/about/about-example-editor";
import { getAboutExample } from "@/lib/api/about-example";
import { getAboutSection } from "@/lib/about-sections";
import { AboutExample } from "@/lib/interfaces/about-example";

export default function AboutExampleEditPage() {
  const params = useParams<{ slug: string; postId: string }>();
  const router = useRouter();
  const section = getAboutSection(params.slug);
  const [example, setExample] = useState<AboutExample | null>(null);

  useEffect(() => {
    if (!section) {
      router.replace("/about");
      return;
    }
    getAboutExample(params.postId)
      .then((value) => {
        if (value.category !== section.category) {
          router.replace(`/about/${section.slug}`);
          return;
        }
        setExample(value);
      })
      .catch(() => {
        toast.error("소개 글을 불러오지 못했습니다.");
        router.replace(`/about/${section.slug}`);
      });
  }, [params.postId, router, section]);

  if (!section || !example) return null;
  return <AboutExampleEditor section={section} example={example} />;
}
