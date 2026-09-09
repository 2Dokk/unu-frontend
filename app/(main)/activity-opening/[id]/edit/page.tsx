"use client";

import { useParams } from "next/navigation";
import { ActivityOpeningRequestForm } from "@/components/custom/activity-opening/activity-opening-request-form";

export default function ActivityOpeningEditPage() {
  const { id } = useParams<{ id: string }>();
  return <ActivityOpeningRequestForm requestId={id} />;
}
