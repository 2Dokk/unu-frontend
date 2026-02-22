"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronRight,
  UserCheck,
  UserX,
  X,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { getAllUsers, searchUsers } from "@/lib/api/user";
import { getAllQuarters } from "@/lib/api/quarter";
import { UserResponseDto } from "@/lib/interfaces/auth";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { getRoleBadgeVariant, getRoleLabel } from "@/lib/utils/role-utils";

type RoleFilter = "ALL" | "MEMBER" | "MANAGER" | "ADMIN";
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function MembersManagementPage() {
  const router = useRouter();

  // Data state
  const [members, setMembers] = useState<UserResponseDto[]>([]);
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ALL");
  const [joinedQuarterFilter, setJoinedQuarterFilter] = useState<string>("ALL");
  const [nameSearch, setNameSearch] = useState("");
  const [studentIdSearch, setStudentIdSearch] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError(null);
      const [membersData, quartersData] = await Promise.all([
        getAllUsers(),
        getAllQuarters(),
      ]);
      setMembers(membersData);
      setQuarters(quartersData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("학회원 정보를 불러오는데 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    try {
      setLoading(true);
      setError(null);

      const params: {
        role?: string;
        isActive?: boolean;
        joinedQuarter?: string;
        name?: string;
        studentId?: string;
      } = {};

      if (roleFilter !== "ALL") params.role = roleFilter;
      if (activeFilter === "ACTIVE") params.isActive = true;
      if (activeFilter === "INACTIVE") params.isActive = false;
      if (joinedQuarterFilter !== "ALL")
        params.joinedQuarter = joinedQuarterFilter;
      if (nameSearch.trim()) params.name = nameSearch.trim();
      if (studentIdSearch.trim()) params.studentId = studentIdSearch.trim();

      const results = await searchUsers(params);
      setMembers(results);
    } catch (err) {
      console.error("Search failed:", err);
      setError("검색에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setRoleFilter("ALL");
    setActiveFilter("ALL");
    setJoinedQuarterFilter("ALL");
    setNameSearch("");
    setStudentIdSearch("");
    loadInitialData();
  }

  function handleRowClick(memberId: string) {
    router.push(`/manage/members/${memberId}`);
  }

  const filteredMembers = members;
  const hasFilters =
    roleFilter !== "ALL" ||
    activeFilter !== "ALL" ||
    joinedQuarterFilter !== "ALL" ||
    nameSearch.trim() !== "" ||
    studentIdSearch.trim() !== "";

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b pb-6">
        <h1 className="text-2xl font-bold tracking-tight">학회원</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          학회원 정보를 조회하고 관리합니다
        </p>
      </div>

      {/* Compact Filter Toolbar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
          {/* Role Filter */}
          <Select
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value as RoleFilter)}
          >
            <SelectTrigger className="w-32 h-9 bg-white">
              <SelectValue placeholder="전체 역할" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 역할</SelectItem>
              <SelectItem value="MEMBER">학회원</SelectItem>
              <SelectItem value="MANAGER">운영자</SelectItem>
              <SelectItem value="ADMIN">관리자</SelectItem>
            </SelectContent>
          </Select>

          {/* Active Status Filter */}
          <Select
            value={activeFilter}
            onValueChange={(value) => setActiveFilter(value as ActiveFilter)}
          >
            <SelectTrigger className="w-32 h-9 bg-white">
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 상태</SelectItem>
              <SelectItem value="ACTIVE">활성</SelectItem>
              <SelectItem value="INACTIVE">비활성</SelectItem>
            </SelectContent>
          </Select>

          {/* Joined Quarter Filter */}
          <Select
            value={joinedQuarterFilter}
            onValueChange={setJoinedQuarterFilter}
          >
            <SelectTrigger className="w-40 h-9 bg-white">
              <SelectValue placeholder="전체 분기" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 분기</SelectItem>
              {quarters.map((quarter) => (
                <SelectItem key={quarter.id} value={quarter.name}>
                  {quarter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Name Search */}
          <div className="flex-1 min-w-40">
            <Input
              placeholder="이름 검색"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-9 bg-white"
            />
          </div>

          {/* Student ID Search */}
          <div className="flex-1 min-w-40">
            <Input
              placeholder="학번 검색"
              value={studentIdSearch}
              onChange={(e) => setStudentIdSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-9 bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="ml-auto flex gap-2">
            <Button
              onClick={handleSearch}
              variant="outline"
              size="sm"
              className="h-9 px-10"
            >
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
            {hasFilters && (
              <Button
                onClick={handleReset}
                variant="ghost"
                size="sm"
                className="h-9 px-4"
              >
                <X className="h-4 w-4 mr-2" />
                초기화
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-5">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State - No members */}
      {!loading && filteredMembers.length === 0 && !hasFilters && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <Filter className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  등록된 학회원이 없어요
                </h3>
                <p className="text-sm text-muted-foreground">
                  학회원 정보가 아직 등록되지 않았습니다
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State - No filtered results */}
      {!loading && filteredMembers.length === 0 && hasFilters && (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-muted p-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  조건에 맞는 학회원이 없어요
                </h3>
                <p className="text-sm text-muted-foreground">
                  다른 필터를 시도해보세요
                </p>
              </div>
              <Button variant="outline" onClick={handleReset}>
                필터 초기화
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members Table */}
      {!loading && filteredMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              학회원 목록
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredMembers.length}명)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>학번</TableHead>
                  <TableHead>아이디</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>가입 분기</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(member.id)}
                  >
                    <TableCell className="font-medium">
                      {member.name || "—"}
                    </TableCell>
                    <TableCell>{member.studentId || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.username}
                    </TableCell>
                    <TableCell className="space-x-1">
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
                    <TableCell>
                      {member.isActive ? (
                        <Badge variant="default" className="gap-1">
                          <UserCheck className="h-3 w-3" />
                          활성
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <UserX className="h-3 w-3" />
                          비활성
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.joinedQuarter?.name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
