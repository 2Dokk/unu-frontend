// ========================
// ATTENDANCE INPUT CONTENT COMPONENT
// ========================

import { Button } from "@/components/ui/button copy";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input copy";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActivityParticipantResponse } from "@/lib/interfaces/activity-participant";
import {
  AlertCircle,
  Check,
  CheckCircle,
  Icon,
  X,
  XCircle,
} from "lucide-react";
import React from "react";

interface AttendanceInputContentProps {
  participants: ActivityParticipantResponse[];
  attendanceData: {
    present: Set<number>;
    absent: Set<number>;
    excused: Set<number>;
  };
  selectedParticipants: Set<number>;
  attendanceSearchQuery: string;
  attendanceStatusTab: "present" | "absent" | "excused";
  isEditingAttendance: boolean;
  onToggleSelection: (id: number) => void;
  onBulkAssignStatus: (status: "present" | "absent" | "excused") => void;
  onMoveParticipant: (
    id: number,
    status: "present" | "absent" | "excused",
  ) => void;
  onRemoveParticipant: (id: number) => void;
  onSearchChange: (query: string) => void;
  onTabChange: (tab: "present" | "absent" | "excused") => void;
  onSelectAll: () => void;
  onClear: () => void;
}
// TODO: Refactor attendanceData to use ActivityParticipantResponse consistently
// To remove duplication of participant lookups
export function AttendanceInputContent({
  participants,
  attendanceData,
  selectedParticipants,
  attendanceSearchQuery,
  attendanceStatusTab,
  isEditingAttendance,
  onToggleSelection,
  onBulkAssignStatus,
  onMoveParticipant,
  onRemoveParticipant,
  onSearchChange,
  onTabChange,
  onSelectAll,
  onClear,
}: AttendanceInputContentProps) {
  console.log(attendanceData);
  const approvedParticipants = participants.filter(
    (p) => p.status === "APPROVED",
  );

  const unassignedParticipants = approvedParticipants.filter(
    (p) =>
      !attendanceData.present.has(p.id) &&
      !attendanceData.absent.has(p.id) &&
      !attendanceData.excused.has(p.id),
  );

  const filteredUnassigned = unassignedParticipants.filter((p) => {
    if (!attendanceSearchQuery) return true;
    const query = attendanceSearchQuery.toLowerCase();
    return (
      p.user?.name?.toLowerCase().includes(query) ||
      p.user?.studentId?.toLowerCase().includes(query)
    );
  });

  const getParticipantsForStatus = (
    status: "present" | "absent" | "excused",
  ) => {
    return approvedParticipants.filter((p) => attendanceData[status].has(p.id));
  };

  const statusConfig = {
    present: {
      label: "출석",
      count: attendanceData.present.size,
      icon: CheckCircle,
      stripClass: "border-l-4 border-l-emerald-500",
      iconClass: "text-emerald-600",
    },
    absent: {
      label: "결석",
      count: attendanceData.absent.size,
      icon: XCircle,
      stripClass: "border-l-4 border-l-rose-500",
      iconClass: "text-rose-600",
    },
    excused: {
      label: "사유",
      count: attendanceData.excused.size,
      icon: AlertCircle,
      stripClass: "border-l-4 border-l-amber-500",
      iconClass: "text-amber-600",
    },
  };

  return (
    <div className="grid grid-cols-[2fr_3fr] gap-4 h-125">
      {/* Left Panel: Participant List */}
      <div className="border rounded-lg p-4 flex flex-col">
        <div className="space-y-3 shrink-0">
          <h3 className="font-medium text-sm">참여자 목록</h3>
          <Input
            placeholder="이름 또는 학번 검색"
            value={attendanceSearchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9"
          />
          {selectedParticipants.size > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selectedParticipants.size}명 선택
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-green-600"
                onClick={() => onBulkAssignStatus("present")}
              >
                → 출석
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-red-600"
                onClick={() => onBulkAssignStatus("absent")}
              >
                → 결석
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-yellow-600"
                onClick={() => onBulkAssignStatus("excused")}
              >
                → 사유
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto mt-3 space-y-1">
          {filteredUnassigned.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              {attendanceSearchQuery
                ? "검색 결과가 없습니다"
                : "모든 참여자가 분류되었습니다"}
            </div>
          ) : (
            filteredUnassigned.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer"
                onClick={() => onToggleSelection(p.id)}
              >
                <Checkbox
                  checked={selectedParticipants.has(p.id)}
                  onCheckedChange={() => onToggleSelection(p.id)}
                />
                <div className="flex-1 text-sm">
                  <div className="font-medium">{p.user?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.user?.studentId}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Status Tabs */}
      <div className="border rounded-lg flex flex-col">
        <Tabs
          value={attendanceStatusTab}
          onValueChange={(v) => onTabChange(v as any)}
        >
          <div className="border-b px-4 pt-3">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="present">
                출석 {statusConfig.present.count}명
              </TabsTrigger>
              <TabsTrigger value="absent">
                결석 {statusConfig.absent.count}명
              </TabsTrigger>
              <TabsTrigger value="excused">
                사유 {statusConfig.excused.count}명
              </TabsTrigger>
            </TabsList>
          </div>

          {(["present", "absent", "excused"] as const).map((status) => (
            <TabsContent
              key={status}
              value={status}
              className="flex-1 overflow-y-auto p-4 m-0"
            >
              <div className="space-y-2">
                {getParticipantsForStatus(status).length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                    {statusConfig[status].label} 처리된 참여자가 없습니다
                  </div>
                ) : (
                  getParticipantsForStatus(status).map((p) => {
                    const {
                      icon: Icon,
                      stripClass,
                      iconClass,
                    } = statusConfig[status];

                    return (
                      <div
                        key={p.id}
                        className={`flex items-center justify-between p-3 rounded-md border bg-background hover:bg-muted/40 transition-colors ${stripClass}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-4 w-4 ${iconClass}`} />

                          <div className="text-sm">
                            <div className="font-medium">{p.user?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.user?.studentId}
                            </div>
                          </div>
                        </div>

                        <X
                          onClick={() => onRemoveParticipant(p.id)}
                          className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="border-t p-3 flex gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onSelectAll}
          >
            전체 출석
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onClear}
          >
            선택 취소
          </Button>
        </div>
      </div>
    </div>
  );
}
