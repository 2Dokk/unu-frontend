"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { searchUsers } from "@/lib/api/user";
import { getAllQuarters } from "@/lib/api/quarter";
import { UserResponseDto } from "@/lib/interfaces/auth";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { getRoleBadgeVariant, getRoleLabel } from "@/lib/utils/role-utils";

type RoleFilter = "ALL" | "MEMBER" | "MANAGER" | "ADMIN";
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function MembersManagementPage() {
  const router = useRouter();

  const [members, setMembers] = useState<UserResponseDto[]>([]);
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
  const [joinedQuarterFilter, setJoinedQuarterFilter] = useState("ALL");
  const [nameSearch, setNameSearch] = useState("");
  const [studentIdSearch, setStudentIdSearch] = useState("");

  const [debouncedName, setDebouncedName] = useState("");
  const [debouncedStudentId, setDebouncedStudentId] = useState("");

  // Load quarters on mount
  useEffect(() => {
    async function loadQuarters() {
      try {
        const quartersData = await getAllQuarters();
        setQuarters(quartersData);
      } catch (err) {
        console.error("Failed to load quarters:", err);
      }
    }
    loadQuarters();
  }, []);

  // Debounce text inputs (500ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(nameSearch), 500);
    return () => clearTimeout(t);
  }, [nameSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedStudentId(studentIdSearch), 500);
    return () => clearTimeout(t);
  }, [studentIdSearch]);

  // Auto-search when any filter changes
  useEffect(() => {
    async function search() {
      setLoading(true);
      try {
        const params: {
          role?: string;
          isCurrentQuarterActive?: boolean;
          joinedQuarter?: string;
          name?: string;
          studentId?: string;
        } = {};
        if (roleFilter !== "ALL") params.role = roleFilter;
        if (activeFilter === "ACTIVE") params.isCurrentQuarterActive = true;
        if (activeFilter === "INACTIVE") params.isCurrentQuarterActive = false;
        if (joinedQuarterFilter !== "ALL")
          params.joinedQuarter = joinedQuarterFilter;
        if (debouncedName.trim()) params.name = debouncedName.trim();
        if (debouncedStudentId.trim())
          params.studentId = debouncedStudentId.trim();
        const results = await searchUsers(params);
        setMembers(results);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }
    search();
  }, [
    roleFilter,
    activeFilter,
    joinedQuarterFilter,
    debouncedName,
    debouncedStudentId,
  ]);

  const hasFilters =
    roleFilter !== "ALL" ||
    activeFilter !== "ALL" ||
    joinedQuarterFilter !== "ALL" ||
    nameSearch.trim() !== "" ||
    studentIdSearch.trim() !== "";

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">학회원 관리</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          학회원 정보를 조회하고 관리합니다
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>학회원 목록</CardTitle>

          {/* Filters */}
          <div className="flex flex-col gap-3 mt-4">
            {/* Row 1: Search inputs */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="이름 검색..."
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="학번 검색..."
                  value={studentIdSearch}
                  onChange={(e) => setStudentIdSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={roleFilter}
                onValueChange={(value) => setRoleFilter(value as RoleFilter)}
              >
                <SelectTrigger className="w-full md:w-35 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    전체 역할
                  </SelectItem>
                  <SelectItem value="MEMBER" className="text-xs">
                    학회원
                  </SelectItem>
                  <SelectItem value="MANAGER" className="text-xs">
                    운영자
                  </SelectItem>
                  <SelectItem value="ADMIN" className="text-xs">
                    관리자
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={activeFilter}
                onValueChange={(value) =>
                  setActiveFilter(value as ActiveFilter)
                }
              >
                <SelectTrigger className="w-full md:w-35 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    전체 상태
                  </SelectItem>
                  <SelectItem value="ACTIVE" className="text-xs">
                    활동 중
                  </SelectItem>
                  <SelectItem value="INACTIVE" className="text-xs">
                    활동 안 함
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={joinedQuarterFilter}
                onValueChange={setJoinedQuarterFilter}
              >
                <SelectTrigger className="w-full md:w-35 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL" className="text-xs">
                    전체 가입 분기
                  </SelectItem>
                  {quarters.map((quarter) => (
                    <SelectItem
                      key={quarter.id}
                      value={quarter.name}
                      className="text-xs"
                    >
                      {quarter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {hasFilters
                ? "검색 결과가 없습니다"
                : "아직 등록된 학회원이 없습니다"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead className="hidden sm:table-cell text-center">
                    학번
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-center">
                    아이디
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-center">
                    역할
                  </TableHead>
                  <TableHead className="hidden sm:table-cell text-center">
                    상태
                  </TableHead>
                  <TableHead className="hidden lg:table-cell text-center">
                    가입 분기
                  </TableHead>
                  <TableHead className="hidden lg:table-cell text-center">
                    이메일
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow
                    key={member.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/manage/members/${member.id}`)}
                  >
                    <TableCell className="font-medium">
                      {member.name || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {member.studentId || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {member.username}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell space-x-0.5 pt-4 pb-4">
                      {member.userRoles?.length ? (
                        member.userRoles.map((role) => (
                          <Badge
                            key={role.id}
                            variant={getRoleBadgeVariant(role.role.name)}
                          >
                            {getRoleLabel(role.role.name)}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline">없음</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {member.isCurrentQuarterActive ? (
                        <Badge variant="default" className="gap-1">
                          <UserCheck className="h-3 w-3" />
                          활동 중
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <UserX className="h-3 w-3" />
                          활동 안 함
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {member.joinedQuarter?.name || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      {member.email}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
