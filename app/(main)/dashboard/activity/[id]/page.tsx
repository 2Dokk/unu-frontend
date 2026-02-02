import { ActivityDetails } from "@/components/custom/activity/activity-details";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ActivityDetails activityId={Number(id)} />;
}
