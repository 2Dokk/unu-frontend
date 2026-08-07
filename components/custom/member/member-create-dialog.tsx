"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAllQuarters } from "@/lib/api/quarter";
import { migrateUsers, UserMigrationResultDto } from "@/lib/api/migration";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { formatPhoneNumber } from "@/lib/utils/phone-utils";

interface MemberCreateDialogProps {
  onCreated: () => void;
}

const EMPTY_FORM = {
  name: "",
  username: "",
  password: "",
  studentId: "",
  email: "",
  phoneNumber: "",
  major: "",
  subMajor: "",
  githubId: "",
};

function toCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildSingleUserCsv(
  form: typeof EMPTY_FORM,
  joinedQuarterName: string,
): File {
  const header = [
    "name",
    "username",
    "password",
    "student_id",
    "github_id",
    "phone_number",
    "major",
    "sub_major",
    "email",
    "is_current_quarter_active",
    "is_alumni",
    "joined_quarter_name",
  ].join(",");

  const row = [
    form.name,
    form.username,
    form.password,
    form.studentId,
    form.githubId,
    form.phoneNumber,
    form.major,
    form.subMajor,
    form.email,
    "false",
    "false",
    joinedQuarterName,
  ]
    .map(toCsvField)
    .join(",");

  return new File([`${header}\n${row}\n`], "single-user.csv", {
    type: "text/csv",
  });
}

function describeResult(result: UserMigrationResultDto): string | null {
  if (result.created > 0) return null;
  if (result.skipped > 0) return "이미 존재하는 아이디 또는 학번입니다.";
  const raw = result.errors[0] ?? "";
  if (/constraint|duplicate|unique/i.test(raw)) {
    return "이미 사용 중인 이메일, 전화번호 또는 GitHub 아이디입니다.";
  }
  return "등록에 실패했습니다. 입력값을 다시 확인해주세요.";
}

export function MemberCreateDialog({ onCreated }: MemberCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [joinedQuarterId, setJoinedQuarterId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    getAllQuarters()
      .then(setQuarters)
      .catch(() => {});
  }, [open]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setJoinedQuarterId("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  const update =
    (key: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const quarterName =
        quarters.find((q) => q.id === joinedQuarterId)?.name ?? "";
      const file = buildSingleUserCsv(form, quarterName);
      const result = await migrateUsers(file);

      const message = describeResult(result);
      if (message) {
        setError(message);
        return;
      }

      toast.success(`${form.name}님을 등록했습니다.`);
      handleOpenChange(false);
      onCreated();
    } catch {
      setError("등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="mr-1.5 h-4 w-4" />
          학회원 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>학회원 추가</DialogTitle>
          <DialogDescription>
            학회원 정보를 직접 입력해 계정을 바로 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="member-name">이름</FieldLabel>
              <Input
                id="member-name"
                value={form.name}
                onChange={update("name")}
                placeholder="이름을 입력하세요"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="member-username">아이디</FieldLabel>
              <Input
                id="member-username"
                value={form.username}
                onChange={update("username")}
                placeholder="로그인 아이디"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="member-password">비밀번호</FieldLabel>
              <Input
                id="member-password"
                type="password"
                value={form.password}
                onChange={update("password")}
                placeholder="초기 비밀번호"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="member-studentId">학번</FieldLabel>
              <Input
                id="member-studentId"
                value={form.studentId}
                onChange={update("studentId")}
                placeholder="학번을 입력하세요"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="member-email">이메일</FieldLabel>
              <Input
                id="member-email"
                type="text"
                value={form.email}
                onChange={update("email")}
                placeholder="이메일을 입력하세요"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="member-phoneNumber">전화번호</FieldLabel>
              <Input
                id="member-phoneNumber"
                type="tel"
                inputMode="numeric"
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    phoneNumber: formatPhoneNumber(e.target.value),
                  }))
                }
                placeholder="010-0000-0000"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="member-major">전공</FieldLabel>
              <Input
                id="member-major"
                value={form.major}
                onChange={update("major")}
                placeholder="전공을 입력하세요"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="member-subMajor">부전공</FieldLabel>
              <Input
                id="member-subMajor"
                value={form.subMajor}
                onChange={update("subMajor")}
                placeholder="부전공 / 복수전공"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="member-githubId">GitHub ID</FieldLabel>
              <Input
                id="member-githubId"
                value={form.githubId}
                onChange={update("githubId")}
                placeholder="GitHub 아이디를 입력하세요"
              />
            </Field>
            <Field>
              <FieldLabel>가입 분기</FieldLabel>
              <Select value={joinedQuarterId} onValueChange={setJoinedQuarterId}>
                <SelectTrigger>
                  <SelectValue placeholder="가입 분기를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
