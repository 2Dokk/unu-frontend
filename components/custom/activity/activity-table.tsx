import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { searchActivities } from "@/lib/api/activity";
import {
  ACTIVITY_STATUS_MAP,
  ActivityResponse,
} from "@/lib/interfaces/activity";
import { useEffect, useState } from "react";

interface ActivityTableProps {
  quarter?: string;
  activityType?: string;
  status?: string;
  searchTerm?: string;
}

export function ActivityTable({
  quarter,
  activityType,
  status,
  searchTerm,
}: ActivityTableProps) {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const data = await searchActivities({
          title: searchTerm,
          status,
          activityTypeId: activityType,
          quarterId: quarter,
        });
        setActivities(data);
      } catch (error) {
        console.error("Failed to fetch activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [quarter, activityType, status, searchTerm]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-center">제목</TableHead>
          <TableHead className="text-center">설명</TableHead>
          <TableHead className="text-center">상태</TableHead>
          <TableHead className="text-center">활동 유형</TableHead>
          <TableHead className="text-center">담당자</TableHead>
          <TableHead className="text-center">분기</TableHead>
        </TableRow>
      </TableHeader>
      {loading && (
        <TableBody>
          <TableRow>
            <TableCell colSpan={6}>
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      )}
      {activities.length === 0 && !loading && (
        <TableBody>
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              활동이 없습니다.
            </TableCell>
          </TableRow>
        </TableBody>
      )}
      <TableBody>
        {activities.map((activity) => (
          <TableRow key={activity.id}>
            <TableCell className="font-medium">{activity.title}</TableCell>
            <TableCell>{activity.description}</TableCell>
            <TableCell>
              {ACTIVITY_STATUS_MAP[activity.status] || activity.status}
            </TableCell>
            <TableCell>{activity.activityType.name}</TableCell>
            <TableCell>{activity.assignee.username}</TableCell>
            <TableCell>{activity.quarter.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
