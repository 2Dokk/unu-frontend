"use client";

import { QuarterSelector } from "@/components/custom/quarter/quarter-selector";
import {
  NextQuarterButton,
  PrevQuarterButton,
} from "@/components/custom/quarter/next-prev-quarter";
import { ActivityTypeSelector } from "@/components/custom/activity/activity-type-selector";
import { ActivityStatusSelector } from "@/components/custom/activity/activity-status-selector";
import { SearchForm } from "@/components/custom/activity/activity-search-bar";
import { ActivityTable } from "@/components/custom/activity/activity-table";
import { useState } from "react";
import { QuarterResponse } from "@/lib/interfaces/quarter";

const ActivityPage = () => {
  const [quarter, setQuarter] = useState<string>();
  const [activityType, setActivityType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  return (
    <div className="flex flex-1 flex-col space-y-4 p-4">
      {/* 첫 번째 줄: Quarter 관련 */}
      <div className="flex justify-center items-center">
        <QuarterSelector value={quarter} onChange={setQuarter} />
      </div>
      {/* 두 번째 줄: 필터 및 검색 */}
      <div className="flex items-center gap-4">
        <ActivityTypeSelector value={activityType} onChange={setActivityType} />
        <ActivityStatusSelector value={status} onChange={setStatus} />
        <SearchForm value={searchTerm} onChange={setSearchTerm} />
      </div>
      <div>
        <ActivityTable
          quarter={quarter}
          activityType={activityType}
          status={status}
          searchTerm={searchTerm}
        />
      </div>
    </div>
  );
};

export default ActivityPage;
