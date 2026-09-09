"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AboutExampleEditor } from "@/components/custom/about/about-example-editor";
import { getAboutSection } from "@/lib/about-sections";

export default function AboutExampleCreatePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const section = getAboutSection(params.slug);

  useEffect(() => {
    if (!section) router.replace("/about");
  }, [router, section]);

  if (!section) return null;
  return <AboutExampleEditor section={section} />;
}
