"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  createActivityForMe,
  getActivityById,
  searchActivities,
} from "@/lib/api/activity";
import { getAllActivityTypes } from "@/lib/api/activity-type";
import { getCurrentQuarter } from "@/lib/api/quarter";
import {
  createActivityParticipant,
  getActivityParticipantsByActivityId,
} from "@/lib/api/activity-participant";
import { searchUsers } from "@/lib/api/user";
import {
  ActivityRequest,
  ActivityResponse,
  ActivityTypeResponse,
} from "@/lib/interfaces/activity";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { UserResponseDto } from "@/lib/interfaces/auth";
import { Calendar, Search, X } from "lucide-react";

interface ActivityCreationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ActivityCreationForm({
  onSuccess,
  onCancel,
}: ActivityCreationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeResponse[]>(
    [],
  );
  const [currentQuarter, setCurrentQuarter] = useState<QuarterResponse | null>(
    null,
  );
  const [formData, setFormData] = useState<ActivityRequest>({
    title: "",
    description: "",
    status: "CREATED",
    activityTypeId: "",
    quarterId: "",
    startDate: "",
    endDate: "",
  });

  // Project-specific state
  const [isProject, setIsProject] = useState(false);
  const [isRenewed, setIsRenewed] = useState(false);
  const [previousActivityId, setPreviousActivityId] = useState("");
  const [previousProjects, setPreviousProjects] = useState<ActivityResponse[]>(
    [],
  );
  const [acceptsNewMembers, setAcceptsNewMembers] = useState(false);
  const [initialMembers, setInitialMembers] = useState<UserResponseDto[]>([]);
  const [memberSearchInput, setMemberSearchInput] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState<
    UserResponseDto[]
  >([]);
  const [memberSearchLoading, setMemberSearchLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesData, quarterData] = await Promise.all([
          getAllActivityTypes(),
          getCurrentQuarter(),
        ]);
        const filteredTypes = typesData.filter(
          (t) => t.code === "PROJECT" || t.code === "STUDY",
        );
        setActivityTypes(filteredTypes);
        setCurrentQuarter(quarterData);
        setFormData((prev) => ({
          ...prev,
          quarterId: quarterData.id,
          startDate: quarterData.startDate,
          endDate: quarterData.endDate,
        }));
      } catch (error: any) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  // Detect PROJECT type
  useEffect(() => {
    const selected = activityTypes.find(
      (t) => t.id === formData.activityTypeId,
    );
    const project = selected?.code === "PROJECT";
    setIsProject(project);
    if (!project) {
      setIsRenewed(false);
      setPreviousActivityId("");
      setAcceptsNewMembers(false);
      setInitialMembers([]);
    }
  }, [formData.activityTypeId, activityTypes]);

  // Load previous projects when isRenewed is toggled on
  useEffect(() => {
    if (!isRenewed || !formData.activityTypeId) return;
    searchActivities({ activityTypeId: formData.activityTypeId })
      .then(setPreviousProjects)
      .catch(console.error);
  }, [isRenewed, formData.activityTypeId]);

  // Auto-fill from selected previous project
  useEffect(() => {
    if (!previousActivityId) return;
    Promise.all([
      getActivityById(previousActivityId),
      getActivityParticipantsByActivityId({ activityId: previousActivityId }),
    ])
      .then(([activity, participants]) => {
        setFormData((prev) => ({
          ...prev,
          title: activity.title,
          description: activity.description,
        }));
        const approvedMembers = participants
          .filter((p) => p.status === "APPROVED")
          .map((p) => p.user);
        setInitialMembers(approvedMembers);
      })
      .catch(console.error);
  }, [previousActivityId]);

  const handleMemberSearch = async () => {
    if (!memberSearchInput.trim()) return;
    setMemberSearchLoading(true);
    try {
      const results = await searchUsers({ name: memberSearchInput.trim() });
      setMemberSearchResults(
        results.filter((u) => !initialMembers.some((m) => m.id === u.id)),
      );
    } catch (error: any) {
      console.error("Failed to search users:", error);
    } finally {
      setMemberSearchLoading(false);
    }
  };

  const addMember = (user: UserResponseDto) => {
    setInitialMembers((prev) => [...prev, user]);
    setMemberSearchResults((prev) => prev.filter((u) => u.id !== user.id));
  };

  const removeMember = (userId: string) => {
    setInitialMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const activityData: ActivityRequest = {
        ...formData,
        status: isProject && acceptsNewMembers ? "OPEN" : "CREATED",
        parentActivityId:
          isRenewed && previousActivityId ? previousActivityId : undefined,
      };
      const created = await createActivityForMe(activityData);

      // Add existing team members as APPROVED participants
      if (initialMembers.length > 0) {
        await Promise.all(
          initialMembers.map((member) =>
            createActivityParticipant({
              activityId: created.id,
              userId: member.id,
              status: "APPROVED",
            }),
          ),
        );
      }

      onSuccess?.();
      router.push("/activities");
    } catch (error: any) {
      console.error("Failed to create activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ActivityRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else router.back();
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">활동 만들기</h1>
        <p className="text-sm text-muted-foreground">
          프로젝트나 스터디를 만들어 팀원들과 함께 시작하세요
        </p>
      </div>

      {/* Basic Info Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
          <CardDescription>
            활동에 대한 기본 정보를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="activity-form"
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Activity Type */}
            <div className="space-y-2">
              <Label htmlFor="activityType" className="text-sm font-medium">
                활동 유형 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.activityTypeId}
                onValueChange={(value) => handleChange("activityTypeId", value)}
                required
              >
                <SelectTrigger id="activityType" className="h-10">
                  <SelectValue placeholder="활동 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PROJECT: 이전 분기 이어서 진행 — placed before title/description so auto-fill is useful */}
            {isProject && (
              <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      이전 분기에서 진행하던 프로젝트인가요?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      선택하면 이전 프로젝트의 정보를 자동으로 불러옵니다.
                    </p>
                  </div>
                  <Switch
                    checked={isRenewed}
                    onCheckedChange={(checked) => {
                      setIsRenewed(checked);
                      if (!checked) {
                        setPreviousActivityId("");
                        setFormData((prev) => ({
                          ...prev,
                          title: "",
                          description: "",
                        }));
                        setInitialMembers([]);
                      }
                    }}
                  />
                </div>
                {isRenewed && (
                  <Select
                    value={previousActivityId}
                    onValueChange={setPreviousActivityId}
                  >
                    <SelectTrigger className="h-10 bg-white">
                      <SelectValue placeholder="이전 분기 프로젝트를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {previousProjects.length === 0 ? (
                        <SelectItem value="_none" disabled>
                          프로젝트가 없습니다
                        </SelectItem>
                      ) : (
                        previousProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.title}
                            {p.quarter ? ` (${p.quarter.name})` : ""}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                제목 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="예: 알고리즘 스터디 1기"
                required
                className="h-10"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                설명 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder={
                  "활동 목표와 내용을 설명해주세요.\n예: 매주 알고리즘 문제를 풀고 코드 리뷰를 진행합니다."
                }
                required
                rows={5}
                className="resize-none"
              />
            </div>

            <Separator />

            {/* Auto-set Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">
                  자동 설정 정보
                </h3>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">분기</p>
                    <p className="text-base font-semibold mt-0.5">
                      {currentQuarter?.name || "로딩 중..."}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-slate-200">
                    자동
                  </Badge>
                </div>
                <Separator className="bg-slate-200" />
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    활동 기간
                  </p>
                  <p className="text-sm text-slate-600">
                    {formData.startDate ? formatDate(formData.startDate) : "-"}
                    {" ~ "}
                    {formData.endDate ? formatDate(formData.endDate) : "-"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    현재 분기의 기간이 자동으로 설정됩니다
                  </p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Project-specific Card */}
      {isProject && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>프로젝트 설정</CardTitle>
            <CardDescription>
              팀원 구성과 모집 방식을 설정해주세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Accepts new members */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  팀원 모집이 필요한가요?
                </Label>
              </div>
              <Switch
                checked={acceptsNewMembers}
                onCheckedChange={setAcceptsNewMembers}
              />
            </div>

            <Separator />

            {/* Initial team members */}
            <div className="space-y-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">기존 팀원 등록</Label>
                <p className="text-xs text-muted-foreground">
                  확정된 팀원을 추가할 수 있습니다.
                </p>
              </div>

              {/* Member search */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="이름으로 검색"
                    value={memberSearchInput}
                    onChange={(e) => setMemberSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleMemberSearch();
                      }
                    }}
                    className="pl-9 h-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={handleMemberSearch}
                  disabled={memberSearchLoading}
                >
                  <span className="text-xs">검색</span>
                </Button>
              </div>

              {/* Search results */}
              {memberSearchResults.length > 0 && (
                <div className="border rounded-md divide-y">
                  {memberSearchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {user.name || user.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.studentId}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => addMember(user)}
                      >
                        추가
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Added members */}
              {initialMembers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {initialMembers.map((member) => (
                    <Badge
                      key={member.id}
                      variant="secondary"
                      className="gap-1 pr-1"
                    >
                      {member.name || member.username}
                      <button
                        type="button"
                        onClick={() => removeMember(member.id)}
                        className="ml-1 rounded-full hover:bg-slate-300 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={loading}
        >
          취소
        </Button>
        <Button
          type="submit"
          form="activity-form"
          disabled={loading}
          className="min-w-32"
        >
          {loading ? "생성 중..." : "활동 만들기"}
        </Button>
      </div>
    </div>
  );
}
