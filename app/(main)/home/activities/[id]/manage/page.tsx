"use client";

import { ActivityManagementScreen } from "@/app/(main)/manage/activities/[id]/page";

export default function HostedActivityManagementPage() {
  return <ActivityManagementScreen viewMode="assignee" />;
}
