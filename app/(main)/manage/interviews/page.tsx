"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  ExternalLink,
  FileText,
  GripVertical,
  Loader2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { getApplicationsByRecruitmentId } from "@/lib/api/application";
import { getAllRecruitments } from "@/lib/api/recruitment";
import {
  ApplicationAnswers,
  ApplicationResponse,
} from "@/lib/interfaces/application";
import { parseSchema } from "@/lib/interfaces/form-builder";
import { RecruitmentResponse } from "@/lib/interfaces/recruitment";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "지원 완료",
  IN_PROGRESS: "검토 중",
  WAITING: "대기",
  HOLD: "보류",
  PASSED: "합격",
  REJECTED: "불합격",
};

function parseAnswers(value: string | ApplicationAnswers): ApplicationAnswers {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as ApplicationAnswers;
  } catch {
    return {};
  }
}

function displayAnswer(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "-";
  return value?.trim() || "-";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
    .replaceAll("\n", "<br>");
}

function escapeTsv(value: string): string {
  if (!/[\t\n"]/.test(value)) return value;
  return `"${value.replaceAll('"', '""')}"`;
}

export default function InterviewManagementPage() {
  const [recruitments, setRecruitments] = useState<RecruitmentResponse[]>([]);
  const [selectedRecruitmentId, setSelectedRecruitmentId] = useState("");
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [currentApplicantId, setCurrentApplicantId] = useState("");
  const [draggedApplicantId, setDraggedApplicantId] = useState<string | null>(
    null,
  );
  const [dragOverApplicantId, setDragOverApplicantId] = useState<string | null>(
    null,
  );
  const [loadingRecruitments, setLoadingRecruitments] = useState(true);
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [sheetCreated, setSheetCreated] = useState(false);

  useEffect(() => {
    getAllRecruitments()
      .then((data) =>
        setRecruitments(
          data.filter((recruitment) => recruitment.type === "NEW_MEMBER"),
        ),
      )
      .catch((error) => {
        console.error("Failed to load recruitments:", error);
        toast.error("신규 학회원 모집 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoadingRecruitments(false));
  }, []);

  const orderedApplications = applications;
  const selectedRecruitment = recruitments.find(
    (recruitment) => recruitment.id === selectedRecruitmentId,
  );
  const currentIndex = orderedApplications.findIndex(
    (application) => application.id === currentApplicantId,
  );
  const currentApplicant =
    currentIndex >= 0 ? orderedApplications[currentIndex] : null;
  const answers = currentApplicant
    ? parseAnswers(currentApplicant.answers)
    : {};
  const questions = currentApplicant
    ? parseSchema(currentApplicant.formSnapshot).questions
    : [];

  async function createInterviewSheet() {
    if (!selectedRecruitmentId) return;
    try {
      setCreatingSheet(true);
      const data = await getApplicationsByRecruitmentId(selectedRecruitmentId);
      const activeApplications = data.filter(
        (application) => application.status !== "CANCELED",
      );
      const sorted = [...activeApplications].sort(
        (a, b) =>
          a.studentId.localeCompare(b.studentId) ||
          a.name.localeCompare(b.name, "ko"),
      );
      setApplications(sorted);
      setCurrentApplicantId(sorted[0]?.id ?? "");
      setSheetCreated(true);
    } catch (error) {
      console.error("Failed to create interview sheet:", error);
      toast.error("면접 시트를 불러오지 못했습니다.");
    } finally {
      setCreatingSheet(false);
    }
  }

  function moveApplicant(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    setApplications((current) => {
      const draggedIndex = current.findIndex(
        (application) => application.id === draggedId,
      );
      const targetIndex = current.findIndex(
        (application) => application.id === targetId,
      );
      if (draggedIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [draggedApplication] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, draggedApplication);
      return next;
    });
  }

  async function copyInterviewSheet() {
    if (orderedApplications.length === 0) return;
    try {
      type SheetCell = {
        value: string;
        colspan?: number;
        kind?: "title" | "label" | "question" | "answer" | "interview";
      };
      const sheetColumnCount = 24;
      const sheetColumnWidth = 30;
      const sheetWidth = sheetColumnCount * sheetColumnWidth;
      const sheetQuestions = parseSchema(
        orderedApplications[0].formSnapshot,
      ).questions.filter(
        (question) =>
          question.type === "SHORT_TEXT" || question.type === "LONG_TEXT",
      );
      const rows: SheetCell[][] = orderedApplications.flatMap(
        (application) => {
          const applicationAnswers = parseAnswers(application.answers);
          return [
            [
              {
                value: `${application.name}`,
                colspan: sheetColumnCount,
                kind: "title" as const,
              },
            ],
            [
              { value: "학번", colspan: 5, kind: "label" as const },
              { value: application.studentId, colspan: 7 },
              { value: "전공", colspan: 5, kind: "label" as const },
              { value: application.major, colspan: 7 },
            ],
            [
              { value: "GitHub ID", colspan: 5, kind: "label" as const },
              { value: application.githubId ?? "", colspan: 7 },
              { value: "복수·부전공", colspan: 5, kind: "label" as const },
              { value: application.subMajor ?? "", colspan: 7 },
            ],
            ...sheetQuestions.map((question) => [
              {
                value: question.title,
                colspan: 6,
                kind: "question" as const,
              },
              {
                value: displayAnswer(applicationAnswers[question.id]),
                colspan: 18,
                kind: "answer" as const,
              },
            ]),
            [
              { value: "면접 내용", colspan: 6, kind: "interview" as const },
              { value: "", colspan: 18, kind: "interview" as const },
            ],
            [
              {
                value: "면접관 소견",
                colspan: 6,
                kind: "interview" as const,
              },
              { value: "", colspan: 18, kind: "interview" as const },
            ],
            [{ value: "", colspan: sheetColumnCount }],
          ];
        },
      );
      const plainText = rows
        .map((row) => {
          const expandedCells = row.flatMap((cell) => [
            cell.value,
            ...Array((cell.colspan ?? 1) - 1).fill(""),
          ]);
          return expandedCells.map(escapeTsv).join("\t");
        })
        .join("\n");
      const html = `
        <table width="${sheetWidth}" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:11pt;table-layout:fixed;width:${sheetWidth}px">
          <colgroup>${Array.from(
            { length: sheetColumnCount },
            () =>
              `<col width="${sheetColumnWidth}" style="width:${sheetColumnWidth}px">`,
          ).join("")}</colgroup>
          <tbody>
            <tr aria-hidden="true" style="height:1px;line-height:1px">
              ${Array.from(
                { length: sheetColumnCount },
                () =>
                  `<td width="${sheetColumnWidth}" height="1" style="width:${sheetColumnWidth}px;height:1px;padding:0;border:0;font-size:1px;line-height:1px;color:transparent">&nbsp;</td>`,
              ).join("")}
            </tr>
            ${rows
            .map(
              (row) =>
                `<tr>${row
                  .map((cell) => {
                    const styles = {
                      title:
                        "font-weight:700;font-size:12pt;padding:10px 12px",
                      label:
                        "font-weight:700;padding:8px 10px;white-space:nowrap;word-break:keep-all;overflow-wrap:normal",
                      question:
                        "font-weight:700;padding:9px 10px;white-space:nowrap;word-break:keep-all;overflow-wrap:normal",
                      answer:
                        "padding:9px 10px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word",
                      interview:
                        "padding:9px 10px;min-height:72px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word",
                    };
                    const isInterviewLabel =
                      cell.kind === "interview" && Boolean(cell.value);
                    const cellStyle = isInterviewLabel
                      ? "font-weight:700;padding:9px 10px;white-space:nowrap;word-break:keep-all;overflow-wrap:normal"
                      : cell.kind
                        ? styles[cell.kind]
                        : "padding:8px 10px;white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word";
                    const isSpacer = row.length === 1 && !cell.value;
                    const colspan = cell.colspan ?? 1;
                    const width = colspan * sheetColumnWidth;
                    const content = cell.value
                      ? cell.kind === "title"
                        ? `<h3 style="font-size:13pt;font-weight:700;margin:0">${escapeHtml(cell.value)}</h3>`
                        : escapeHtml(cell.value)
                      : "&nbsp;";
                    return `<td colspan="${colspan}" width="${width}" style="width:${width}px;${isSpacer ? "border:0;height:18px" : `border:1px solid;vertical-align:top;${cellStyle}`}">${content}</td>`;
                  })
                  .join("")}</tr>`,
            )
            .join("")}</tbody>
        </table>`;

      if (typeof ClipboardItem !== "undefined" && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([plainText], { type: "text/plain" }),
            "text/html": new Blob([html], { type: "text/html" }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      toast.success("면접 시트를 복사했습니다. Google docs에 붙여넣으세요.");
    } catch (error) {
      console.error("Failed to copy interview sheet:", error);
      toast.error("면접 시트를 복사하지 못했습니다.");
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 px-6 py-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">면접 관리</h1>
        <p className="text-sm text-muted-foreground">
          신규 학회원 지원서를 확인하고 Google docs용 면접 시트를 만듭니다.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="interview-recruitment">신규 학회원 모집</Label>
            {loadingRecruitments ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedRecruitmentId}
                onValueChange={(value) => {
                  setSelectedRecruitmentId(value);
                  setApplications([]);
                  setCurrentApplicantId("");
                  setSheetCreated(false);
                }}
              >
                <SelectTrigger id="interview-recruitment">
                  <SelectValue placeholder="면접을 진행할 모집을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {recruitments.map((recruitment) => (
                    <SelectItem key={recruitment.id} value={recruitment.id}>
                      {recruitment.title} · {recruitment.quarter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button
            type="button"
            onClick={() => void createInterviewSheet()}
            disabled={!selectedRecruitmentId || creatingSheet}
            className="shrink-0"
          >
            {creatingSheet ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            면접 시트 만들기
          </Button>
        </CardContent>
      </Card>

      {sheetCreated && orderedApplications.length === 0 && (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed text-center">
          <Users className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">확인할 지원자가 없습니다.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            취소되지 않은 지원서가 등록되면 면접 시트에 표시됩니다.
          </p>
        </div>
      )}

      {sheetCreated && currentApplicant && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {selectedRecruitment?.title}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">면접 대상 지원자</h2>
                <Badge variant="secondary">
                  {orderedApplications.length}명
                </Badge>
              </div>
            </div>
            <Button type="button" onClick={() => void copyInterviewSheet()}>
              <ClipboardCopy className="h-4 w-4" />
              Google docs용 면접 시트 복사
            </Button>
          </div>

          <section className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold">지원자 순서</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                왼쪽 손잡이를 잡고 원하는 위치로 이동하세요. 아래 순서가
                복사되는 면접 시트에 그대로 반영됩니다.
              </p>
            </div>
            <div className="max-h-[390px] overflow-y-auto overscroll-contain rounded-md border [scrollbar-gutter:stable]">
              {orderedApplications.map((application, index) => {
                const isDragging = draggedApplicantId === application.id;
                const isDragOver = dragOverApplicantId === application.id;
                const isCurrent = currentApplicantId === application.id;
                return (
                  <div
                    key={application.id}
                    draggable
                    aria-grabbed={isDragging}
                    onDragStart={(event) => {
                      setDraggedApplicantId(application.id);
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", application.id);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDragOverApplicantId(application.id);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const draggedId =
                        draggedApplicantId ||
                        event.dataTransfer.getData("text/plain");
                      if (draggedId) moveApplicant(draggedId, application.id);
                      setDraggedApplicantId(null);
                      setDragOverApplicantId(null);
                    }}
                    onDragEnd={() => {
                      setDraggedApplicantId(null);
                      setDragOverApplicantId(null);
                    }}
                    className={cn(
                      "grid grid-cols-[36px_36px_minmax(0,1fr)_auto] items-center gap-3 border-b px-3 py-3 transition-colors last:border-b-0",
                      isCurrent && "bg-muted/40",
                      isDragging && "opacity-40",
                      isDragOver && !isDragging && "border-t-2 border-t-primary",
                    )}
                  >
                    <span
                      className="flex cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
                      title="드래그하여 순서 변경"
                    >
                      <GripVertical className="h-4 w-4" />
                    </span>
                    <span className="text-center text-xs font-medium tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {application.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {application.studentId} · {application.major}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={isCurrent ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setCurrentApplicantId(application.id)}
                    >
                      {isCurrent ? "선택됨" : "지원서 보기"}
                    </Button>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold">
                  {currentApplicant.name}
                </h2>
                <Badge variant="secondary">
                  {STATUS_LABELS[currentApplicant.status] ??
                    currentApplicant.status}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {currentApplicant.studentId} · {currentApplicant.major}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="이전 지원자"
                disabled={currentIndex <= 0}
                onClick={() =>
                  setCurrentApplicantId(
                    orderedApplications[currentIndex - 1].id,
                  )
                }
              >
                <ChevronLeft />
              </Button>
              <span className="min-w-20 text-center text-sm font-medium tabular-nums">
                {currentIndex + 1} / {orderedApplications.length}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="다음 지원자"
                disabled={currentIndex >= orderedApplications.length - 1}
                onClick={() =>
                  setCurrentApplicantId(
                    orderedApplications[currentIndex + 1].id,
                  )
                }
              >
                <ChevronRight />
              </Button>
            </div>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">지원자 정보</h3>
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableBody>
                  {[
                    ["학번", currentApplicant.studentId],
                    ["이름", currentApplicant.name],
                    ["전공", currentApplicant.major],
                    ["복수·부전공", currentApplicant.subMajor || "-"],
                    ["이메일", currentApplicant.email],
                    ["연락처", currentApplicant.phoneNumber],
                  ].map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell className="w-32 bg-muted/40 text-xs font-medium text-muted-foreground">
                        {label}
                      </TableCell>
                      <TableCell className="whitespace-pre-wrap break-words text-sm">
                        {value}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell className="w-32 bg-muted/40 text-xs font-medium text-muted-foreground">
                      GitHub ID
                    </TableCell>
                    <TableCell className="text-sm">
                      {currentApplicant.githubId ? (
                        <a
                          href={`https://github.com/${encodeURIComponent(currentApplicant.githubId)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 font-medium hover:underline"
                        >
                          {currentApplicant.githubId}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">지원서 답변</h3>
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableBody>
                  {questions.length === 0 ? (
                    <TableRow>
                      <TableCell className="py-10 text-center text-sm text-muted-foreground">
                        등록된 지원서 질문이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    questions.map((question, index) => (
                      <TableRow key={question.id}>
                        <TableCell className="w-[36%] min-w-44 whitespace-pre-wrap bg-muted/40 align-top text-sm font-medium">
                          <span className="mr-2 text-xs text-muted-foreground">
                            {index + 1}
                          </span>
                          {question.title}
                        </TableCell>
                        <TableCell className="whitespace-pre-wrap break-words align-top text-sm leading-6">
                          {displayAnswer(answers[question.id])}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
