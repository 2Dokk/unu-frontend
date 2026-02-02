"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Spinner } from "@/components/ui/spinner";
import { createActivityForMe } from "@/lib/api/activity";
import { getAllActivityTypes } from "@/lib/api/activity-type";
import { getCurrentQuarter } from "@/lib/api/quarter";
import { ActivityRequest } from "@/lib/interfaces/activity";
import { ActivityTypeResponse } from "@/lib/interfaces/activity";
import { QuarterResponse } from "@/lib/interfaces/quarter";

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
      router.push("/dashboard/activity");
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

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>새 활동 생성</CardTitle>
        <CardDescription>
          새로운 활동을 생성하고 참여자를 모집하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 기본 정보 섹션 */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">제목 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="활동 제목을 입력하세요"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">설명 *</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="활동 설명을 입력하세요"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="activityType">활동 유형 *</Label>
                    <Select
                      value={formData.activityTypeId.toString()}
                      onValueChange={(value) =>
                        handleChange("activityTypeId", Number(value))
                      }
                    >
                      <SelectTrigger id="activityType">
                        <SelectValue placeholder="활동 유형 선택" />
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
                </div>
              </div>
            </div>

            <Separator />

            {/* 일정 및 담당 정보 섹션 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">일정</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quarter">분기</Label>
                    <Input
                      id="quarter"
                      value={currentQuarter?.name || ""}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">시작일 *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleChange("startDate", e.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">종료일 *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleChange("endDate", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* 버튼 섹션 */}
          <div className="flex justify-end gap-3 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner />
                  <span className="ml-2">생성 중...</span>
                </>
              ) : (
                "활동 생성"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
