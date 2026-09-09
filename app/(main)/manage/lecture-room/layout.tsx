"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function LectureRoomLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { hasAnyRole, isLoading } = useAuth();
  const canAccess = hasAnyRole([
    "ADMIN",
    "MANAGER",
    "LECTURE_ROOM_MANAGER",
  ]);

  useEffect(() => {
    if (!isLoading && !canAccess) router.replace("/home");
  }, [canAccess, isLoading, router]);

  if (isLoading || !canAccess) return null;

  return children;
}
