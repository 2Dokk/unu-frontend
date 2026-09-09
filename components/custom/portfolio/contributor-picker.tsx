"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Search, UserPlus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getAllUsers } from "@/lib/api/user";
import { ContributorInfo } from "@/lib/interfaces/portfolio";
import { UserResponseDto } from "@/lib/interfaces/auth";
import { cn } from "@/lib/utils";

interface ContributorPickerProps {
  contributors: ContributorInfo[];
  onChange: (next: ContributorInfo[]) => void;
}

export function ContributorPicker({
  contributors,
  onChange,
}: ContributorPickerProps) {
  const [allUsers, setAllUsers] = useState<UserResponseDto[]>([]);
  const [search, setSearch] = useState("");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [externalOpen, setExternalOpen] = useState(false);
  const [externalName, setExternalName] = useState("");
  const [externalRole, setExternalRole] = useState("");

  useEffect(() => {
    getAllUsers()
      .then(setAllUsers)
      .catch(() => {});
  }, []);

  const selectedIds = new Set(
    contributors.map((c) => c.userId).filter(Boolean) as string[],
  );

  const filteredUsers = allUsers.filter((u) => {
    const q = search.trim().toLowerCase();
    return (
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.studentId?.toLowerCase().includes(q)
    );
  });

  const toggleUser = (user: UserResponseDto) => {
    if (selectedIds.has(user.id)) {
      onChange(contributors.filter((c) => c.userId !== user.id));
    } else {
      onChange([
        ...contributors,
        {
          id: user.id,
          userId: user.id,
          name: user.name || user.username,
          role: "",
        },
      ]);
    }
  };

  const addExternal = () => {
    const name = externalName.trim();
    if (!name) return;
    onChange([
      ...contributors,
      {
        id: `ext-local:${crypto.randomUUID()}`,
        userId: null,
        name,
        role: externalRole.trim(),
      },
    ]);
    setExternalName("");
    setExternalRole("");
  };

  const removeContributor = (id: string) => {
    onChange(contributors.filter((c) => c.id !== id));
  };

  const updateRole = (id: string, role: string) => {
    onChange(contributors.map((c) => (c.id === id ? { ...c, role } : c)));
  };

  const updateName = (id: string, name: string) => {
    onChange(contributors.map((c) => (c.id === id ? { ...c, name } : c)));
  };

  return (
    <Card className="gap-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>기여자</CardTitle>
            {contributors.length > 0 && (
              <span className="text-sm text-muted-foreground">
                총 {contributors.length}명
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
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
              기여자 추가
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setExternalOpen((v) => !v);
                if (externalOpen) {
                  setExternalName("");
                  setExternalRole("");
                }
              }}
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              외부 인원 추가
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {contributors.length > 0 ? (
          <div className="space-y-1.5">
            {contributors.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-md border px-3 py-1.5"
              >
                {c.userId ? (
                  // 학회원 이름은 계정에서 오므로 여기서 고치지 않는다.
                  <span className="text-sm font-medium shrink-0 min-w-16 flex-1">
                    {c.name}
                  </span>
                ) : (
                  <div className="flex flex-1 items-center gap-1.5">
                    <Input
                      value={c.name}
                      onChange={(e) => updateName(c.id, e.target.value)}
                      placeholder="이름"
                      className="h-7 text-xs flex-1 rounded-2xl"
                    />
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      외부
                    </Badge>
                  </div>
                )}
                <Input
                  value={c.role}
                  onChange={(e) => updateRole(c.id, e.target.value)}
                  placeholder="역할"
                  className="h-7 text-xs flex-1 rounded-2xl"
                />
                <button
                  type="button"
                  onClick={() => removeContributor(c.id)}
                  className="rounded-full hover:bg-muted p-0.5 shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          !selectorOpen &&
          !externalOpen && (
            <p className="text-sm text-muted-foreground">
              등록된 기여자가 없습니다.
            </p>
          )
        )}

        {externalOpen && (
          <div className="flex items-center gap-2 rounded-md border p-2">
            <Input
              autoFocus
              value={externalName}
              onChange={(e) => setExternalName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExternal();
                }
              }}
              placeholder="이름"
              className="h-8 flex-1 text-sm"
            />
            <Input
              value={externalRole}
              onChange={(e) => setExternalRole(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExternal();
                }
              }}
              placeholder="역할"
              className="h-8 flex-1 text-sm"
            />
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0"
              disabled={!externalName.trim()}
              onClick={addExternal}
            >
              추가
            </Button>
          </div>
        )}

        {selectorOpen && (
          <div className="rounded-md border overflow-hidden">
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

            <div className="h-52 overflow-y-auto divide-y">
              {filteredUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  검색 결과가 없습니다
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedIds.has(user.id);
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleUser(user)}
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
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs shrink-0">
                          등록됨
                        </Badge>
                      )}
                    </button>
                  );
                })
              )}
            </div>

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
