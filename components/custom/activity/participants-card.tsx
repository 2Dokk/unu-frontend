"use client";

import { useState } from "react";
import { X, Search, Check, Users, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserResponseDto } from "@/lib/interfaces/auth";
import { ActivityParticipantResponse } from "@/lib/interfaces/activity-participant";
import { cn } from "@/lib/utils";

interface ParticipantsCardProps {
  allUsers: UserResponseDto[];
  existingParticipants?: ActivityParticipantResponse[];
  onRemoveExisting?: (participantId: string) => void;
  newUserIds: string[];
  onToggleNew: (userId: string) => void;
}

export function ParticipantsCard({
  allUsers,
  existingParticipants = [],
  onRemoveExisting,
  newUserIds,
  onToggleNew,
}: ParticipantsCardProps) {
  const [search, setSearch] = useState("");
  const [selectorOpen, setSelectorOpen] = useState(false);

  const existingUserIds = new Set(existingParticipants.map((p) => p.user.id));
  const totalSelected = existingParticipants.length + newUserIds.length;

  const filteredUsers = allUsers.filter((u) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.studentId?.toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>참여자</CardTitle>
            {totalSelected > 0 && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                총 {totalSelected}명
              </span>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectorOpen((v) => !v);
              if (selectorOpen) setSearch("");
            }}
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            참여자 추가
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Participant list */}
        {totalSelected > 0 ? (
          <div className="flex flex-col gap-1 rounded-md border divide-y overflow-y-auto">
            {existingParticipants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 h-9 text-sm"
              >
                <span className="font-medium flex-1">
                  {p.user.name || p.user.username}
                </span>
                {p.user.studentId && (
                  <span className="text-xs text-muted-foreground">
                    {p.user.studentId}
                  </span>
                )}
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(p.id)}
                    className="rounded-full hover:bg-muted p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {newUserIds.map((uid) => {
              const user = allUsers.find((u) => u.id === uid);
              if (!user) return null;
              return (
                <div
                  key={uid}
                  className="flex items-center gap-2 px-3 h-9 text-sm"
                >
                  <span className="font-medium flex-1">
                    {user.name || user.username}
                  </span>
                  {user.studentId && (
                    <span className="text-xs text-muted-foreground">
                      {user.studentId}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => onToggleNew(uid)}
                    className="rounded-full hover:bg-muted p-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          !selectorOpen && (
            <p className="text-sm text-muted-foreground">
              등록된 참여자가 없습니다.
            </p>
          )
        )}

        {/* Selector — shown only when open */}
        {selectorOpen && (
          <div className="rounded-md border overflow-hidden">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 border-b bg-background">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                placeholder="이름 또는 학번으로 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Fixed-height scrollable list */}
            <div className="h-52 overflow-y-auto divide-y">
              {filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  검색 결과가 없습니다
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isExisting = existingUserIds.has(user.id);
                  const isNew = newUserIds.includes(user.id);
                  const isSelected = isExisting || isNew;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        if (isExisting) {
                          const participant = existingParticipants.find(
                            (p) => p.user.id === user.id,
                          );
                          if (participant && onRemoveExisting) {
                            onRemoveExisting(participant.id);
                          }
                        } else {
                          onToggleNew(user.id);
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        isSelected ? "bg-muted/60" : "hover:bg-muted/40",
                      )}
                    >
                      <div
                        className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center shrink-0",
                          isSelected
                            ? "bg-primary border-primary"
                            : "border-muted-foreground/40",
                        )}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">
                          {user.name || user.username}
                        </span>
                        {user.studentId && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {user.studentId}
                          </span>
                        )}
                      </div>
                      {isExisting && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          등록됨
                        </Badge>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-3 py-1.5 border-t bg-muted/20">
              <span className="text-xs text-muted-foreground">
                {search
                  ? `${filteredUsers.length}명 검색됨 / 전체 ${allUsers.length}명`
                  : `전체 ${allUsers.length}명`}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectorOpen(false);
                  setSearch("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
