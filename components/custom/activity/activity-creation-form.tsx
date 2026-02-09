"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { createActivityForMe } from "@/lib/api/activity";
import { getAllActivityTypes } from "@/lib/api/activity-type";
import { getCurrentQuarter } from "@/lib/api/quarter";
import { ActivityRequest } from "@/lib/interfaces/activity";
import { ActivityTypeResponse } from "@/lib/interfaces/activity";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { Calendar, Info } from "lucide-react";

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
    activityTypeId: 0,
    quarterId: 0,
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesData, quarterData] = await Promise.all([
          getAllActivityTypes(),
          getCurrentQuarter(),
        ]);
        setActivityTypes(typesData);
        setCurrentQuarter(quarterData);
        setFormData((prev) => ({
          ...prev,
          quarterId: quarterData.id,
          startDate: quarterData.startDate,
          endDate: quarterData.endDate,
        }));
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createActivityForMe(formData);
      onSuccess?.();
      router.push("/activities");
    } catch (error) {
      console.error("Failed to create activity:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof ActivityRequest, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          새 활동 만들기
        </h1>
        <p className="text-sm text-muted-foreground">
          프로젝트나 스터디를 생성하고 팀원들과 함께 시작하세요
        </p>
      </div>

      {/* Info Alert */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-900">
          활동 기간은 선택한 분기에 맞춰 자동으로 설정됩니다. 필요시 기간을
          조정할 수 있습니다.
        </p>
      </div>

      {/* Main Form Card */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-xl">활동 정보</CardTitle>
          <CardDescription>
            활동에 대한 기본 정보를 입력해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Field */}
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

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                설명 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="활동 목표와 내용을 설명해주세요.&#10;예: 매주 알고리즘 문제를 풀고 코드 리뷰를 진행합니다.&#10;백준, 프로그래머스 등 다양한 플랫폼을 활용합니다."
                required
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                참여를 유도할 수 있는 구체적인 설명을 작성해주세요
              </p>
            </div>

            {/* Activity Type Field */}
            <div className="space-y-2">
              <Label htmlFor="activityType" className="text-sm font-medium">
                활동 유형 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.activityTypeId.toString()}
                onValueChange={(value) =>
                  handleChange("activityTypeId", Number(value))
                }
                required
              >
                <SelectTrigger id="activityType" className="h-10">
                  <SelectValue placeholder="활동 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-6" />

            {/* Auto-set Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">
                  자동 설정 정보
                </h3>
              </div>

              {/* Quarter Info */}
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
                  <p className="text-sm font-medium text-slate-700 mb-2">
                    활동 기간
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <span>
                      {formData.startDate
                        ? formatDate(formData.startDate)
                        : "-"}
                    </span>
                    <span>~</span>
                    <span>
                      {formData.endDate ? formatDate(formData.endDate) : "-"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    현재 분기의 기간이 자동으로 설정됩니다
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" disabled={loading} className="min-w-32">
                {loading ? "생성 중..." : "활동 만들기"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
