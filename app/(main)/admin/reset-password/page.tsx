"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, KeyRound, Copy, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/contexts/AuthContext";
import { getAllUsers, resetUserPassword } from "@/lib/api/user";
import { UserResponseDto } from "@/lib/interfaces/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();

  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserResponseDto | null>(null);

  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasRole("ADMIN"))) {
      router.push("/login");
    }
  }, [isAuthenticated, hasRole, authLoading, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && hasRole("ADMIN")) {
      getAllUsers()
        .then(setUsers)
        .catch(() => setUsers([]))
        .finally(() => setUsersLoading(false));
    }
  }, [authLoading, isAuthenticated, hasRole]);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.studentId?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q)
    );
  });

  const handleReset = async () => {
    if (!selectedUser) return;
    setResetting(true);
    setError(null);
    setTempPassword(null);
    try {
      const result = await resetUserPassword(selectedUser.id);
      setTempPassword(result.temporaryPassword);
    } catch (error: any) {
      setError(error.response?.data || "비밀번호 초기화에 실패했습니다.");
    } finally {
      setResetting(false);
    }
  };

  const handleCopy = async () => {
    if (!tempPassword) return;
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (authLoading || usersLoading) {
    return (
      <div className="mx-auto w-full max-w-lg px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || !hasRole("ADMIN")) return null;

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-8 space-y-6">
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/admin")}
          className="mb-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          시스템 관리로
        </Button>
        <h1 className="text-xl font-bold tracking-tight">비밀번호 초기화</h1>
        <p className="text-sm text-muted-foreground">
          학회원의 비밀번호를 초기화하고 임시 비밀번호를 발급합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">학회원 선택</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-between font-normal"
              >
                <span className={cn(!selectedUser && "text-muted-foreground")}>
                  {selectedUser
                    ? `${selectedUser.name} (${selectedUser.studentId})`
                    : "학회원 검색"}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[--radix-popover-trigger-width] p-0"
              align="start"
            >
              <div className="border-b px-3 py-2">
                <Input
                  placeholder="이름 또는 학번 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 border-0 p-0 shadow-none focus-visible:ring-0"
                  autoFocus
                />
              </div>
              <div className="max-h-60 overflow-y-auto py-1">
                {filteredUsers.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                    검색 결과가 없습니다
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(user);
                        setOpen(false);
                        setSearch("");
                        setTempPassword(null);
                        setError(null);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted",
                        selectedUser?.id === user.id && "bg-muted",
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          selectedUser?.id === user.id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      <span className="font-medium">{user.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {user.studentId}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full"
            disabled={!selectedUser || resetting}
            onClick={handleReset}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            {resetting ? "초기화 중..." : "비밀번호 초기화"}
          </Button>
        </CardContent>
      </Card>

      {tempPassword && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-green-800">
              임시 비밀번호 발급 완료
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-green-700">
              <span className="font-medium">{selectedUser?.name}</span> 님의
              비밀번호가 초기화되었습니다. 아래 임시 비밀번호를 전달해 주세요.
            </p>
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-white px-3 py-2">
              <code className="flex-1 font-mono text-sm tracking-wider">
                {tempPassword}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              로그인 후 반드시 비밀번호를 변경하도록 안내해 주세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
