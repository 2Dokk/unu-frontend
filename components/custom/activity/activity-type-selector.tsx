"use client";

import React, { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityTypeResponse } from "@/lib/interfaces/activity";
import { get } from "http";
import { getAllActivityTypes } from "@/lib/api/activity-type";

interface ActivityTypeSelectorProps {
  value?: string;
  onChange: (value: string) => void;
}

export function ActivityTypeSelector({
  value,
  onChange,
}: ActivityTypeSelectorProps) {
  const [activityTypes, setActivityTypes] = useState<ActivityTypeResponse[]>(
    [],
  );

  useEffect(() => {
    const fetchActivityTypes = async () => {
      try {
        const data = await getAllActivityTypes();
        setActivityTypes(data);
      } catch (error: any) {
        console.error("Failed to fetch activity types:", error);
      }
    };

    fetchActivityTypes();
  }, []);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="활동 유형 선택" />
      </SelectTrigger>
      <SelectContent>
        {activityTypes.map((q) => (
          <SelectItem key={q.id} value={q.id}>
            {q.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
