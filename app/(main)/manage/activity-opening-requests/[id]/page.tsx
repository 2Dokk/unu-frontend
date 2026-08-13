"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { ActivityOpeningStatusBadge } from "@/components/custom/activity-opening/activity-opening-status-badge";

import {
  approveActivityOpeningRequest,
  getActivityOpeningRequestForManagement,
  reviewActivityOpeningRequest,
} from "@/lib/api/activity-opening-request";

import { ActivityOpeningRequestResponse } from "@/lib/interfaces/activity-opening-request";

function formatDate(value?: string | null) {
  return value
    ? new Date(value).toLocaleDateString("ko-KR")
    : "—";
}

function messageFor(error: unknown, fallback: string) {
  const data = (
    error as {
      response?: {
        data?: unknown;
      };
    }
  )?.response?.data;

  return typeof data === "string" && data.trim()
    ? data
    : fallback;
}

type MutableReviewStatus =
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "REJECTED";

export default function ActivityOpeningRequestManagementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [request, setRequest] =
    useState<ActivityOpeningRequestResponse | null>(
      null,
    );

  const [comment, setComment] = useState("");
  const [depositAmount, setDepositAmount] =
    useState("30000");
  const [recruitmentStartDate, setRecruitmentStartDate] =
    useState("");
  const [recruitmentEndDate, setRecruitmentEndDate] =
    useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [approvedStatusTarget, setApprovedStatusTarget] =
    useState<MutableReviewStatus | null>(null);

  useEffect(() => {
    getActivityOpeningRequestForManagement(id)
      .then((data) => {
        setRequest(data);
        setComment(data.reviewComment ?? "");
      })
      .catch(() =>
        toast.error(
          "개설 신청을 불러오지 못했습니다.",
        ),
      )
      .finally(() => setLoading(false));
  }, [id]);

  async function review(
    status: MutableReviewStatus,
  ) {
    if (status !== "SUBMITTED" && !comment.trim()) {
      toast.error("검토 의견을 입력해주세요.");
      return;
    }

    try {
      setUpdating(true);

      const updated =
        await reviewActivityOpeningRequest(
          id,
          status,
          comment.trim(),
        );

      setRequest(updated);
      setComment(updated.reviewComment ?? "");

      const successMessage = {
        SUBMITTED: "검토 대기 상태로 변경했습니다.",
        REVISION_REQUESTED: "보완 요청 상태로 변경했습니다.",
        REJECTED: "반려 상태로 변경했습니다.",
      }[status];

      toast.success(successMessage);
    } catch (error) {
      toast.error(
        messageFor(
          error,
          "검토 상태를 변경하지 못했습니다.",
        ),
      );
    } finally {
      setUpdating(false);
    }
  }

  function requestReviewStatusChange(status: MutableReviewStatus) {
    if (status !== "SUBMITTED" && !comment.trim()) {
      toast.error("검토 의견을 입력해주세요.");
      return;
    }
    if (request?.status === "APPROVED") {
      setApprovedStatusTarget(status);
      return;
    }
    void review(status);
  }

  async function approve() {
    if (!request) return;

    const isStudy =
      request.activityType.code === "STUDY";

    const isSpecialLecture =
      request.activityType.code ===
      "SPECIAL_LECTURE";

    const usesDeposit =
      isStudy || isSpecialLecture;

    const usesRecruitmentSchedule =
      isSpecialLecture ||
      request.acceptsNewMembers;

    if (
      usesRecruitmentSchedule &&
      (!recruitmentStartDate || !recruitmentEndDate)
    ) {
      toast.error("모집 기간을 설정해주세요.");
      return;
    }
    
    if (
      usesRecruitmentSchedule &&
      recruitmentEndDate < recruitmentStartDate
    ) {
      toast.error(
        "모집 종료일은 모집 시작일보다 빠를 수 없습니다.",
      );
      return;
    }
    
    if (
      usesRecruitmentSchedule &&
      request.startDate &&
      recruitmentEndDate > request.startDate
    ) {
      toast.error(
        "모집 종료일은 활동 시작일 이후로 설정할 수 없습니다.",
      );
      return;
    }
    if (
      usesDeposit &&
      depositAmount.trim() === ""
    ) {
      toast.error(
        "참여 보증금을 설정해주세요.",
      );
      return;
    }

    const parsedDepositAmount =
      Number(depositAmount);

    if (
      usesDeposit &&
      (!Number.isInteger(
        parsedDepositAmount,
      ) ||
        parsedDepositAmount < 0)
    ) {
      toast.error(
        "참여 보증금은 0원 이상으로 입력해주세요.",
      );
      return;
    }

    try {
      setUpdating(true);

      const updated =
        await approveActivityOpeningRequest(
          id,
          {
            comment: comment.trim() || undefined,
            depositAmount: usesDeposit
              ? parsedDepositAmount
              : 0,
            recruitmentStartDate: usesRecruitmentSchedule
              ? recruitmentStartDate
              : undefined,
            recruitmentEndDate: usesRecruitmentSchedule
              ? recruitmentEndDate
              : undefined,
          },
        );

      setRequest(updated);

      toast.success(
        "신청을 승인하고 활동을 등록했습니다.",
      );
    } catch (error) {
      toast.error(
        messageFor(
          error,
          "신청을 승인하지 못했습니다.",
        ),
      );
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-12 text-sm text-muted-foreground">
        신청 내용을 불러오는 중입니다.
      </div>
    );
  }

  if (!request) {
    return (
      <div className="mx-auto w-full max-w-6xl px-6 py-12">
        <p>신청을 찾을 수 없습니다.</p>

        <Button
          className="mt-4"
          variant="outline"
          onClick={() => router.back()}
        >
          돌아가기
        </Button>
      </div>
    );
  }

  const reviewable =
    request.status === "SUBMITTED";

  const reviewStatusChangeable =
    request.status === "REVISION_REQUESTED" ||
    request.status === "REJECTED" ||
    request.status === "APPROVED";

  const isProject =
    request.activityType.code ===
    "PROJECT";

  const isStudy =
    request.activityType.code ===
    "STUDY";

  const isSpecialLecture =
    request.activityType.code ===
    "SPECIAL_LECTURE";

  const usesDeposit =
    isStudy || isSpecialLecture;

  const usesRecruitmentSchedule =
    isSpecialLecture ||
    Boolean(request.acceptsNewMembers);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
      {/* 상단 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() =>
          router.push(
            "/manage/activity-opening-requests",
          )
        }
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Button>

      {/* 제목 */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <ActivityOpeningStatusBadge
              status={request.status}
            />

            <span className="text-sm text-muted-foreground">
              {request.activityType.name}
            </span>

            {request.personalProject && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                개인 프로젝트
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight">
            {request.title}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {request.applicant.name} ·{" "}
            {request.applicant.studentId}
          </p>
        </div>

        {request.approvedActivityId && (
          <Button asChild>
            <Link
              href={`/manage/activities/${request.approvedActivityId}`}
            >
              등록된 활동 보기
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* 활동 정보 */}
        <Card className="lg:col-span-7">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              활동 정보
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <section>
              <p className="mb-2 text-sm font-medium">
                활동 소개 및 목적
              </p>

              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {request.description}
              </p>
            </section>

            <Separator />

            {isProject ? (
              <section>
                <p className="mb-2 text-sm font-medium">
                  운영 계획
                </p>

                <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {request.operationPlan}
                </p>
              </section>
            ) : (
              <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-medium">
                    {isStudy
                      ? "스터디 계획서"
                      : "강의 계획서"}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    신청자가 제출한 계획서
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="shrink-0"
                >
                  <a
                    href={
                      request.operationPlan
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    계획서 확인
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </section>
            )}

            {isSpecialLecture && (
              <>
                <Separator />

                <section>
                  <p className="mb-2 text-sm font-medium">강의자 경력</p>

                  {request.instructorCareer ? (
                    <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                      {request.instructorCareer}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      작성된 강의자 경력이 없습니다.
                    </p>
                  )}
                </section>
              </>
            )}

            {(isStudy || isSpecialLecture) && request.materialUrl && (
              <>
                <Separator />
                <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-medium">
                      {isStudy ? "스터디 자료" : "강의자료"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      신청자가 선택적으로 첨부한 자료
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild className="shrink-0">
                    <a
                      href={request.materialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      자료 확인
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </section>
              </>
            )}
          </CardContent>
        </Card>

        {/* 신청 정보 */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              신청 정보
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-x-4 gap-y-4 text-sm">
              <span className="text-muted-foreground">
                활동 기간
              </span>

              <span>
                {formatDate(
                  request.startDate,
                )}{" "}
                -{" "}
                {formatDate(
                  request.endDate,
                )}
              </span>

              <span className="text-muted-foreground">
                분기
              </span>

              <span>
                {request.quarter.name}
              </span>

              {isProject && (
                <>
                  <span className="text-muted-foreground">
                    공개 범위
                  </span>

                  <span>
                    {request.personalProject
                      ? "개인 프로젝트"
                      : "전체 공개"}
                  </span>
                </>
              )}

              {!isSpecialLecture && (
                <>
                  <span className="text-muted-foreground">
                    신규 모집
                  </span>

                  <span>
                    {request.acceptsNewMembers
                      ? "진행"
                      : "진행하지 않음"}
                  </span>

                  {request.acceptsNewMembers && (
                    <>
                      <span className="text-muted-foreground">
                        참여 정원
                      </span>

                      <span>
                        {request.participantLimit
                          ? `${request.participantLimit}명`
                          : "제한 없음"}
                      </span>
                    </>
                  )}
                </>
              )}

              <span className="text-muted-foreground">
                이전 활동
              </span>

              <span>
                {request.parentActivityTitle ??
                  "해당 없음"}
              </span>

              <span className="text-muted-foreground">
                제출일
              </span>

              <span>
                {formatDate(
                  request.submittedAt,
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 참여 정보 */}
        <Card className="lg:col-span-7">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              참여 정보
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {isSpecialLecture ? (
              <p className="text-sm text-muted-foreground">
                강의 개설 신청에는 초기 참여자를
                지정하지 않습니다.
              </p>
            ) : (
              <>
                <section>
                  <p className="mb-3 text-sm font-medium">
                    참여 예정 학회원
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-md bg-muted px-2.5 py-1.5 text-sm">
                      {request.applicant.name}

                      <span className="ml-1.5 text-xs text-muted-foreground">
                        담당자
                      </span>
                    </span>

                    {request.initialMembers.map(
                      (member) => (
                        <span
                          key={member.id}
                          className="rounded-md bg-muted px-2.5 py-1.5 text-sm"
                        >
                          {member.name}

                          <span className="ml-1.5 text-xs text-muted-foreground">
                            {
                              member.studentId
                            }
                          </span>
                        </span>
                      ),
                    )}
                  </div>

                  {request.initialMembers
                    .length === 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      추가로 지정된 참여자는
                      없습니다.
                    </p>
                  )}
                </section>

                {request.acceptsNewMembers &&
                  request.recruitmentPositions && (
                    <>
                      <Separator />

                      <section>
                        <p className="mb-2 text-sm font-medium">
                          모집 희망 포지션
                        </p>

                        <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                          {
                            request.recruitmentPositions
                          }
                        </p>
                      </section>
                    </>
                  )}

              </>
            )}
          </CardContent>
        </Card>

        {/* 검토 */}
        <Card className="lg:col-span-5">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">
              검토
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {reviewable ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="review-comment">
                    검토 의견
                  </Label>

                  <Textarea
                    id="review-comment"
                    rows={4}
                    value={comment}
                    onChange={(event) =>
                      setComment(
                        event.target.value,
                      )
                    }
                    disabled={updating}
                    placeholder="보완할 내용이나 검토 의견을 작성하세요."
                  />
                </div>

                {usesDeposit && (
                  <div className="space-y-2">
                    <Label htmlFor="deposit-amount">
                      참여 보증금
                      <span className="text-red-500">
                        *
                      </span>
                    </Label>

                    <div className="relative">
                      <Input
                        id="deposit-amount"
                        value={depositAmount}
                        onChange={(event) =>
                          setDepositAmount(
                            event.target.value.replace(
                              /\D/g,
                              "",
                            ),
                          )
                        }
                        inputMode="numeric"
                        placeholder="0"
                        className="pr-10"
                        disabled={updating}
                      />

                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        원
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      보증금을 운영하지 않는 경우
                      0원으로 설정해주세요.
                    </p>
                  </div>
                )}
              {usesRecruitmentSchedule&& (
                <div className="space-y-2">
                  <Label>
                    모집 기간
                    <span className="text-red-500">*</span>
                  </Label>

                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <Input
                      type="date"
                      value={recruitmentStartDate}
                      onChange={(event) =>
                        setRecruitmentStartDate(
                          event.target.value,
                        )
                      }
                      disabled={!reviewable || updating}
                    />

                    <span className="text-sm text-muted-foreground">
                      ~
                    </span>

                    <Input
                      type="date"
                      value={recruitmentEndDate}
                      onChange={(event) =>
                        setRecruitmentEndDate(
                          event.target.value,
                        )
                      }
                      disabled={!reviewable || updating}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    설정한 기간에만 학회원이 참여를 신청할 수 있습니다.
                  </p>
                </div>
              )}

                <Separator />

                <div className="grid gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger
                      asChild
                    >
                      <Button
                        className="w-full"
                        disabled={updating}
                      >
                        승인하고 활동 등록
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          신청을 승인할까요?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                          {usesDeposit
                            ? `승인 즉시 활동이 등록되며, 참여 보증금은 ${Number(
                                depositAmount ||
                                  0,
                              ).toLocaleString(
                                "ko-KR",
                              )}원으로 설정됩니다.`
                            : "승인 즉시 정식 활동과 초기 참여자가 등록됩니다."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          돌아가기
                        </AlertDialogCancel>

                        <AlertDialogAction
                          onClick={approve}
                        >
                          승인 및 등록
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      disabled={updating}
                      onClick={() =>
                        review(
                          "REVISION_REQUESTED",
                        )
                      }
                    >
                      보완 요청
                    </Button>

                    <Button
                      variant="destructive"
                      disabled={updating}
                      onClick={() =>
                        review("REJECTED")
                      }
                    >
                      반려
                    </Button>
                  </div>
                </div>
              </>
            ) : reviewStatusChangeable ? (
              <div className="space-y-4">
                {request.status === "APPROVED" && (
                  <div className="border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                    승인 상태를 변경하면 등록된 활동과 해당 활동의 참여·일정
                    기록이 함께 삭제됩니다.
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="review-comment-update">
                    검토 의견
                  </Label>

                  <Textarea
                    id="review-comment-update"
                    rows={4}
                    value={comment}
                    onChange={(event) =>
                      setComment(event.target.value)
                    }
                    disabled={updating}
                    placeholder="상태 변경 사유나 검토 의견을 작성하세요."
                  />
                </div>

                <Separator />

                <div className="grid gap-2">
                  <Button
                    variant="outline"
                    disabled={updating}
                    onClick={() => requestReviewStatusChange("SUBMITTED")}
                  >
                    검토 대기로 변경
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      disabled={
                        updating ||
                        request.status === "REVISION_REQUESTED"
                      }
                      onClick={() =>
                        requestReviewStatusChange("REVISION_REQUESTED")
                      }
                    >
                      보완 요청
                    </Button>

                    <Button
                      variant="destructive"
                      disabled={
                        updating || request.status === "REJECTED"
                      }
                      onClick={() => requestReviewStatusChange("REJECTED")}
                    >
                      반려
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  현재 상태에서는 추가 검토 작업이
                  필요하지 않습니다.
                </p>

                {request.reviewComment && (
                  <>
                    <Separator />

                    <section>
                      <p className="mb-2 text-sm font-medium">
                        검토 의견
                      </p>

                      <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                        {request.reviewComment}
                      </p>
                    </section>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={approvedStatusTarget !== null}
        onOpenChange={(open) => {
          if (!open) setApprovedStatusTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>승인 상태를 변경할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              상태를 변경하면 승인으로 등록된 활동과 해당 활동에 연결된
              참여·일정 기록이 함께 삭제됩니다. 개설 신청 검토 기록은 선택한
              상태로 남습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>돌아가기</AlertDialogCancel>
            <AlertDialogAction
              disabled={updating}
              onClick={() => {
                const status = approvedStatusTarget;
                setApprovedStatusTarget(null);
                if (status) void review(status);
              }}
            >
              활동 삭제 및 상태 변경
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
