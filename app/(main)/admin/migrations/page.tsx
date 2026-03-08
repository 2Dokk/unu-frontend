"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  MinusCircle,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { migrateUsers, UserMigrationResultDto } from "@/lib/api/migration";
import { cn } from "@/lib/utils";

const CSV_COLUMNS = [
  { name: "name", required: true, desc: "이름" },
  {
    name: "username",
    required: true,
    desc: "로그인 아이디. 이미 있으면 해당 행 건너뜀",
  },
  {
    name: "password",
    required: false,
    desc: "비밀번호. 비워두면 비밀번호 없이 생성",
  },
  {
    name: "student_id",
    required: true,
    desc: "학번. 이미 있으면 해당 행 건너뜀",
  },
  { name: "github_id", required: false, desc: "GitHub 아이디" },
  { name: "phone_number", required: false, desc: "전화번호" },
  { name: "major", required: false, desc: "전공" },
  { name: "sub_major", required: false, desc: "부전공 / 복수전공" },
  { name: "email", required: true, desc: "이메일 주소" },
  {
    name: "is_current_quarter_active",
    required: false,
    desc: "이번 분기 활동 여부. 기본값 false",
  },
  { name: "is_alumni", required: false, desc: "" },
  {
    name: "joined_quarter_name",
    required: false,
    desc: "가입 분기. 예) 2019 SPRING. 없으면 자동 생성",
  },
];

export default function MigrationsPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UserMigrationResultDto | null>(null);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasRole("ADMIN"))) {
      router.push("/login");
    }
  }, [isAuthenticated, hasRole, authLoading, router]);

  function pickFile(file: File | null) {
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast.error("CSV 파일만 업로드할 수 있습니다.");
      return;
    }
    setSelectedFile(file);
    setResult(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    pickFile(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const data = await migrateUsers(selectedFile);
      setResult(data);
      toast.success(
        `마이그레이션 완료: ${data.created}명 생성, ${data.skipped}명 스킵, ${data.failed}명 실패`,
      );
    } catch (error: any) {
      console.error("Migration failed:", error);
      toast.error(error.response?.data || "마이그레이션에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function handleReset() {
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (authLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (!isAuthenticated || !hasRole("ADMIN")) return null;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <Button
          onClick={() => router.push("/admin")}
          variant="ghost"
          size="sm"
          className="-ml-2 mb-4 text-muted-foreground"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          시스템 관리
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">학회원 CSV 업로드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          CSV 파일을 업로드하여 학회원을 일괄 생성합니다
        </p>
      </div>

      {/* Upload Area */}
      <div className="rounded-xl border bg-card shadow-sm">
        {/* Drop Zone */}
        <div
          className={cn(
            "relative flex flex-col items-center justify-center gap-3 rounded-t-xl border-b px-6 py-12 transition-colors cursor-pointer select-none",
            dragging
              ? "bg-primary/5 border-primary"
              : selectedFile
                ? "bg-muted/30"
                : "hover:bg-muted/30",
          )}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />

          {selectedFile ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {dragging
                    ? "파일을 놓으세요"
                    : "CSV 파일을 끌어다 놓거나 클릭하여 선택"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  .csv 형식만 지원합니다
                </p>
              </div>
            </>
          )}
        </div>

        {/* CSV Format Reference */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            컬럼 명세
          </p>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {CSV_COLUMNS.map((col) => (
              <div
                key={col.name}
                className="flex items-start gap-2 rounded-md px-3 py-2 bg-muted/40"
              >
                <code className="text-xs font-mono text-foreground shrink-0 pt-px">
                  {col.name}
                </code>
                {col.required && (
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 rounded px-1 py-px shrink-0 mt-px">
                    필수
                  </span>
                )}
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {col.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action */}
        <div className="px-6 pb-5">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                처리 중...
              </>
            ) : (
              "마이그레이션 실행"
            )}
          </Button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold">마이그레이션 결과</h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 divide-x">
            <div className="flex flex-col items-center gap-1 py-6">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 mb-0.5" />
              <span className="text-3xl font-bold tabular-nums text-emerald-500">
                {result.created}
              </span>
              <span className="text-xs text-muted-foreground">생성됨</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-6">
              <MinusCircle className="h-5 w-5 text-amber-500 mb-0.5" />
              <span className="text-3xl font-bold tabular-nums text-amber-500">
                {result.skipped}
              </span>
              <span className="text-xs text-muted-foreground">스킵됨</span>
            </div>
            <div className="flex flex-col items-center gap-1 py-6">
              <XCircle className="h-5 w-5 text-destructive mb-0.5" />
              <span className="text-3xl font-bold tabular-nums text-destructive">
                {result.failed}
              </span>
              <span className="text-xs text-muted-foreground">실패</span>
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="border-t px-6 py-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">오류 내역</span>
                <Badge variant="destructive" className="text-xs">
                  {result.errors.length}
                </Badge>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-lg border bg-muted/50 divide-y">
                {result.errors.map((err, idx) => (
                  <p
                    key={idx}
                    className="px-3 py-2 text-xs font-mono text-destructive leading-relaxed"
                  >
                    {err}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
