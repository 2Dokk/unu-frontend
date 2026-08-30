"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CalendarClock, Check, ChevronRight, Copy, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/AuthContext";
import {
  addSignupInvitationMembers,
  createSignupInvitation,
  getAuthApiErrorMessage,
  getSignupInvitation,
  getSignupInvitations,
  removeSignupInvitationMember,
  revokeSignupInvitation,
  updateSignupInvitationExpiration,
} from "@/lib/api/auth";
import { SignupInvitation, SignupInvitationMember } from "@/lib/interfaces/auth";
import { getAllQuarters } from "@/lib/api/quarter";
import { QuarterResponse } from "@/lib/interfaces/quarter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function toLocalDateTimeInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function initialExpiration() {
  return toLocalDateTimeInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
}

function parseStudentIds(value: string) {
  const entries = value.split(/[\s,]+/).map((entry) => entry.trim()).filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;

  for (const entry of entries) {
    if (!/^\d{8}$/.test(entry)) invalid.push(entry);
    else if (seen.has(entry)) duplicateCount += 1;
    else {
      seen.add(entry);
      valid.push(entry);
    }
  }
  return { valid, invalid, duplicateCount };
}

function invitationState(invitation: SignupInvitation) {
  if (invitation.revokedAt) return { label: "종료", variant: "secondary" as const };
  if (new Date(invitation.expiresAt).getTime() <= Date.now()) return { label: "만료", variant: "outline" as const };
  if (invitation.totalCount > 0 && invitation.usedCount === invitation.totalCount) {
    return { label: "가입 완료", variant: "secondary" as const };
  }
  return { label: "진행 중", variant: "default" as const };
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function SignupLinkPage() {
  const router = useRouter();
  const { isAuthenticated, hasRole, isLoading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<SignupInvitation[]>([]);
  const [quarters, setQuarters] = useState<QuarterResponse[]>([]);
  const [selected, setSelected] = useState<SignupInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [name, setName] = useState("");
  const [quarterId, setQuarterId] = useState("");
  const [expiresAt, setExpiresAt] = useState(initialExpiration);
  const [studentIdText, setStudentIdText] = useState("");
  const [additionalStudentIds, setAdditionalStudentIds] = useState("");
  const [detailExpiration, setDetailExpiration] = useState("");
  const [origin, setOrigin] = useState("");

  const parsedStudentIds = useMemo(() => parseStudentIds(studentIdText), [studentIdText]);
  const parsedAdditionalIds = useMemo(() => parseStudentIds(additionalStudentIds), [additionalStudentIds]);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !hasRole("ADMIN"))) router.push("/login");
  }, [isAuthenticated, hasRole, authLoading, router]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated || !hasRole("ADMIN")) return;
    Promise.allSettled([getSignupInvitations(), getAllQuarters()])
      .then(([invitationResult, quarterResult]) => {
        if (invitationResult.status === "fulfilled") {
          setInvitations(invitationResult.value);
          if (invitationResult.value.length > 0) {
            void selectInvitation(invitationResult.value[0].id);
          }
        } else {
          toast.error(getAuthApiErrorMessage(invitationResult.reason, "회원가입 초대를 불러오지 못했습니다."));
        }

        if (quarterResult.status === "fulfilled") {
          setQuarters(quarterResult.value);
          if (quarterResult.value.length > 0) {
            setQuarterId((current) => current || quarterResult.value[0].id);
          }
        } else {
          toast.error(getAuthApiErrorMessage(quarterResult.reason, "가입 분기 목록을 불러오지 못했습니다."));
        }
      })
      .finally(() => setLoading(false));
  }, [authLoading, isAuthenticated, hasRole]);

  function replaceInvitation(updated: SignupInvitation) {
    setInvitations((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelected(updated);
    setDetailExpiration(toLocalDateTimeInput(new Date(updated.expiresAt)));
  }

  async function selectInvitation(invitationId: string) {
    setDetailLoading(true);
    try {
      const invitation = await getSignupInvitation(invitationId);
      setSelected(invitation);
      setDetailExpiration(toLocalDateTimeInput(new Date(invitation.expiresAt)));
    } catch (error) {
      toast.error(getAuthApiErrorMessage(error, "초대 정보를 불러오지 못했습니다."));
    } finally {
      setDetailLoading(false);
    }
  }

  function resetCreateForm() {
    setName("");
    setExpiresAt(initialExpiration());
    setStudentIdText("");
  }

  async function handleCreate() {
    if (!name.trim() || !quarterId || parsedStudentIds.valid.length === 0) {
      toast.error("초대 정보와 허용 학번을 확인해주세요.");
      return;
    }
    if (parsedStudentIds.invalid.length > 0) {
      toast.error("형식이 올바르지 않은 학번을 먼저 수정해주세요.");
      return;
    }
    setCreating(true);
    try {
      const created = await createSignupInvitation({
        name: name.trim(), joinedQuarterId: quarterId,
        expiresAt: new Date(expiresAt).toISOString(), studentIds: parsedStudentIds.valid,
      });
      setInvitations((current) => [created, ...current]);
      setSelected(created);
      setDetailExpiration(toLocalDateTimeInput(new Date(created.expiresAt)));
      setCreateOpen(false);
      resetCreateForm();
      toast.success("회원가입 초대를 만들었습니다.");
    } catch (error) {
      toast.error(getAuthApiErrorMessage(error, "초대를 만들지 못했습니다."));
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/signup?token=${selected.token}`);
      toast.success("초대 링크를 복사했습니다.");
    } catch {
      toast.error("링크를 복사하지 못했습니다.");
    }
  }

  async function handleAddMembers() {
    if (!selected || parsedAdditionalIds.valid.length === 0) return;
    if (parsedAdditionalIds.invalid.length > 0) {
      toast.error("형식이 올바르지 않은 학번을 먼저 수정해주세요.");
      return;
    }
    setWorking(true);
    try {
      replaceInvitation(await addSignupInvitationMembers(selected.id, parsedAdditionalIds.valid));
      setAdditionalStudentIds("");
      toast.success("허용 학번을 추가했습니다.");
    } catch (error) {
      toast.error(getAuthApiErrorMessage(error, "학번을 추가하지 못했습니다."));
    } finally {
      setWorking(false);
    }
  }

  async function handleRemoveMember(member: SignupInvitationMember) {
    if (!selected) return;
    setWorking(true);
    try {
      await removeSignupInvitationMember(selected.id, member.id);
      replaceInvitation(await getSignupInvitation(selected.id));
      toast.success("허용 학번에서 제외했습니다.");
    } catch (error) {
      toast.error(getAuthApiErrorMessage(error, "학번을 제외하지 못했습니다."));
    } finally {
      setWorking(false);
    }
  }

  async function handleExpirationUpdate() {
    if (!selected || !detailExpiration) return;
    setWorking(true);
    try {
      replaceInvitation(await updateSignupInvitationExpiration(selected.id, new Date(detailExpiration).toISOString()));
      toast.success("만료 시간을 변경했습니다.");
    } catch (error) {
      toast.error(getAuthApiErrorMessage(error, "만료 시간을 변경하지 못했습니다."));
    } finally {
      setWorking(false);
    }
  }

  async function handleRevoke() {
    if (!selected) return;
    setWorking(true);
    try {
      replaceInvitation(await revokeSignupInvitation(selected.id));
      setRevokeOpen(false);
      toast.success("회원가입 초대를 종료했습니다.");
    } catch (error) {
      toast.error(getAuthApiErrorMessage(error, "초대를 종료하지 못했습니다."));
    } finally {
      setWorking(false);
    }
  }

  if (authLoading || loading) {
    return <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full" /></div>;
  }
  if (!isAuthenticated || !hasRole("ADMIN")) return null;

  const selectedState = selected ? invitationState(selected) : null;
  const selectedActive = Boolean(
    selected &&
      !selected.revokedAt &&
      new Date(selected.expiresAt).getTime() > Date.now(),
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-7 px-6 py-8">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">회원가입 관리</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">가입 대상 학번을 등록하고 공용 회원가입 링크의 진행 상태를 관리합니다.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2"><Plus className="size-4" />초대 만들기</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-md border bg-background">
          <div className="border-b px-4 py-3"><h2 className="text-sm font-semibold">초대 목록</h2></div>
          {invitations.length === 0 ? <div className="px-5 py-12 text-center text-sm text-muted-foreground">아직 생성된 초대가 없습니다.</div> : (
            <div className="divide-y">
              {invitations.map((invitation) => {
                const state = invitationState(invitation);
                return (
                  <button key={invitation.id} type="button" onClick={() => void selectInvitation(invitation.id)} className={`w-full px-4 py-4 text-left transition-colors hover:bg-muted/50 ${selected?.id === invitation.id ? "bg-muted" : ""}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><p className="truncate text-sm font-semibold">{invitation.name}</p><p className="mt-1 text-xs text-muted-foreground">{invitation.joinedQuarterName}</p></div>
                      <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs text-muted-foreground">가입 {invitation.usedCount} / {invitation.totalCount}명</span><Badge variant={state.variant}>{state.label}</Badge></div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="min-w-0 rounded-md border bg-background">
          {detailLoading ? <div className="space-y-4 p-6"><Skeleton className="h-8 w-56" /><Skeleton className="h-32 w-full" /><Skeleton className="h-56 w-full" /></div> : !selected ? (
            <div className="flex min-h-80 items-center justify-center p-6 text-sm text-muted-foreground">관리할 초대를 선택해주세요.</div>
          ) : (
            <div className="space-y-7 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{selected.name}</h2>{selectedState && <Badge variant={selectedState.variant}>{selectedState.label}</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{selected.joinedQuarterName} · 가입 {selected.usedCount} / {selected.totalCount}명</p></div>
                {selectedActive && <Button variant="outline" size="sm" onClick={() => setRevokeOpen(true)}><Ban className="mr-2 size-4" />초대 종료</Button>}
              </div>

              <div className="space-y-3 rounded-md bg-muted/45 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold"><Copy className="size-4" />공용 가입 링크</div>
                <div className="flex flex-col gap-2 sm:flex-row"><Input readOnly value={origin ? `${origin}/signup?token=${selected.token}` : ""} className="min-w-0 font-mono text-xs" /><Button type="button" onClick={handleCopy} disabled={!selectedActive}>링크 복사</Button></div>
                <p className="text-xs text-muted-foreground">등록된 학번만 이 링크로 가입할 수 있습니다.</p>
              </div>

              <div className="grid gap-4 border-y py-5 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-2"><Label htmlFor="detail-expiration">만료 시간</Label><Input id="detail-expiration" type="datetime-local" value={detailExpiration} onChange={(event) => setDetailExpiration(event.target.value)} disabled={Boolean(selected.revokedAt)} /></div>
                <Button variant="outline" onClick={handleExpirationUpdate} disabled={working || Boolean(selected.revokedAt)}><CalendarClock className="mr-2 size-4" />만료 시간 변경</Button>
              </div>

              {selectedActive && (
                <div className="space-y-3">
                  <div><h3 className="text-sm font-semibold">허용 학번 추가</h3><p className="mt-1 text-xs text-muted-foreground">줄바꿈, 공백 또는 쉼표로 학번을 구분할 수 있습니다.</p></div>
                  <Textarea value={additionalStudentIds} onChange={(event) => setAdditionalStudentIds(event.target.value)} placeholder={""} className="min-h-24 resize-y font-mono" />
                  <div className="flex items-center justify-between gap-3"><span className="text-xs text-muted-foreground">정상 {parsedAdditionalIds.valid.length}개{parsedAdditionalIds.invalid.length > 0 && ` · 형식 오류 ${parsedAdditionalIds.invalid.length}개`}</span><Button size="sm" onClick={handleAddMembers} disabled={working || parsedAdditionalIds.valid.length === 0}>추가</Button></div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">가입 대상</h3><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="size-4" />총 {selected.totalCount}명</span></div>
                <div className="max-h-[420px] overflow-auto rounded-md border">
                  <Table><TableHeader><TableRow><TableHead>학번</TableHead><TableHead>상태</TableHead><TableHead>가입자</TableHead><TableHead>가입 시각</TableHead><TableHead className="w-12" /></TableRow></TableHeader>
                    <TableBody>{selected.members.map((member) => <TableRow key={member.id}><TableCell className="font-mono">{member.studentId}</TableCell><TableCell>{member.usedAt ? <span className="inline-flex items-center gap-1.5 text-sm"><Check className="size-3.5 text-emerald-600" />가입 완료</span> : <span className="text-sm text-muted-foreground">미가입</span>}</TableCell><TableCell>{member.userName || "-"}</TableCell><TableCell className="whitespace-nowrap text-xs text-muted-foreground">{member.usedAt ? formatDateTime(member.usedAt) : "-"}</TableCell><TableCell>{!member.usedAt && selectedActive && <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => void handleRemoveMember(member)} disabled={working} title="허용 학번에서 제외"><Trash2 className="size-4" /></Button>}</TableCell></TableRow>)}</TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>회원가입 초대 만들기</DialogTitle><DialogDescription>같은 링크를 사용할 가입 대상과 가입 분기를 지정합니다.</DialogDescription></DialogHeader>
          <div className="grid gap-5 py-2">
            <div className="space-y-2"><Label htmlFor="invitation-name">초대 이름</Label><Input id="invitation-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="2026 가을 신규 학회원" maxLength={100} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>가입 분기</Label>
                <Select value={quarterId} onValueChange={setQuarterId} disabled={quarters.length === 0}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={quarters.length === 0 ? "등록된 분기가 없습니다" : "가입 분기 선택"} />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[60] w-[var(--radix-select-trigger-width)]">
                    {quarters.map((quarter) => (
                      <SelectItem key={quarter.id} value={quarter.id}>{quarter.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="invitation-expiration">만료 시간</Label><Input id="invitation-expiration" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-ids">허용 학번</Label><Textarea id="student-ids" value={studentIdText} onChange={(event) => setStudentIdText(event.target.value)} placeholder={"구글 시트의 학번 열을 그대로 붙여넣을 수 있습니다.\n20221234\n20231234"} className="min-h-44 resize-y font-mono" />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs"><span className="text-muted-foreground">정상 {parsedStudentIds.valid.length}개</span>{parsedStudentIds.duplicateCount > 0 && <span className="text-amber-700">중복 {parsedStudentIds.duplicateCount}개 제외</span>}{parsedStudentIds.invalid.length > 0 && <span className="text-destructive">형식 오류 {parsedStudentIds.invalid.length}개</span>}</div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>취소</Button><Button onClick={handleCreate} disabled={creating}>{creating ? "생성 중..." : "초대 링크 생성"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>회원가입 초대를 종료할까요?</AlertDialogTitle><AlertDialogDescription>미가입 학회원은 즉시 이 링크를 사용할 수 없게 됩니다. 이미 가입한 계정에는 영향을 주지 않습니다.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={working}>취소</AlertDialogCancel><AlertDialogAction onClick={handleRevoke} disabled={working}>초대 종료</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
