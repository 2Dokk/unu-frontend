"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { createBook, deleteBook, getBooks, updateBook } from "@/lib/api/book";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Book, BookRequest } from "@/lib/interfaces/book";

const EMPTY_FORM: BookRequest = {
  title: "",
  author: "",
  publisher: "",
  description: "",
  quantity: 1,
  note: "",
};

function messageFor(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  if (data && typeof data === "object") {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export default function BooksPage() {
  const { hasRole } = useAuth();
  const canManage = hasRole("ADMIN");
  const [books, setBooks] = useState<Book[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState<BookRequest>(EMPTY_FORM);

  useEffect(() => {
    getBooks()
      .then(setBooks)
      .catch((error) => {
        console.error("Failed to load books:", error);
        toast.error("보유 도서 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
    if (!normalizedQuery) return books;
    return books.filter((book) =>
      [
        book.title,
        book.author,
        book.publisher ?? "",
        book.description ?? "",
        book.note ?? "",
      ].some((value) =>
        value.toLocaleLowerCase("ko-KR").includes(normalizedQuery),
      ),
    );
  }, [books, query]);

  function openRegisterDialog() {
    setEditingBook(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(book: Book) {
    setEditingBook(book);
    setForm({
      title: book.title,
      author: book.author,
      publisher: book.publisher ?? "",
      description: book.description ?? "",
      quantity: book.quantity,
      note: book.note ?? "",
    });
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    if (saving) return;
    setDialogOpen(open);
    if (!open) setEditingBook(null);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("도서명을 입력해주세요.");
      return;
    }
    if (!form.author.trim()) {
      toast.error("저자를 입력해주세요.");
      return;
    }
    if (!Number.isInteger(form.quantity) || form.quantity < 1 || form.quantity > 999) {
      toast.error("보유 권수는 1권 이상 999권 이하로 입력해주세요.");
      return;
    }
    try {
      setSaving(true);
      const payload: BookRequest = {
        title: form.title.trim(),
        author: form.author.trim(),
        publisher: form.publisher?.trim() || null,
        description: form.description?.trim() || null,
        quantity: form.quantity,
        note: form.note?.trim() || null,
      };
      const saved = editingBook
        ? await updateBook(editingBook.id, payload)
        : await createBook(payload);
      setBooks((current) => {
        const next = editingBook
          ? current.map((book) => (book.id === saved.id ? saved : book))
          : [...current, saved];
        return next.sort((a, b) => a.title.localeCompare(b.title, "ko-KR"));
      });
      setDialogOpen(false);
      setEditingBook(null);
      toast.success(editingBook ? "도서 정보를 수정했습니다." : "도서를 등록했습니다.");
    } catch (error) {
      toast.error(
        messageFor(
          error,
          editingBook ? "도서 정보를 수정하지 못했습니다." : "도서를 등록하지 못했습니다.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deleteBook(deleteTarget.id);
      setBooks((current) => current.filter((book) => book.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("도서를 삭제했습니다.");
    } catch (error) {
      toast.error(messageFor(error, "도서를 삭제하지 못했습니다."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 px-6 py-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">보유 도서</h1>
          <p className="text-sm text-muted-foreground">
            학회에서 보유하고 있는 도서를 확인할 수 있습니다.<br></br>대출을 희망할 시 운영진에게 반드시 먼저 말씀해 주신 후 대출하시기 바랍니다.
          </p>
        </div>
        {canManage && (
          <Button type="button" onClick={openRegisterDialog}>
            <Plus className="h-4 w-4" />
            도서 등록
          </Button>
        )}
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="도서명 또는 저자 검색"
            className="pl-9"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          총 {filteredBooks.length}권
        </p>
      </div>

      {loading ? (
        <Card className="py-0">
          <CardContent className="divide-y p-0">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 px-5 py-5 sm:px-6">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : filteredBooks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {query ? "검색 결과가 없습니다." : "등록된 도서가 없습니다."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden py-0">
          <CardContent className="p-0">
            <Table className="min-w-[720px] table-fixed [&_td]:pl-6 [&_th]:pl-6">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">도서명</TableHead>
                  <TableHead className="w-[18%]">저자</TableHead>
                  <TableHead className="w-[18%]">출판사</TableHead>
                  <TableHead className="w-[34%]">비고</TableHead>
                  {canManage && (
                    <TableHead className="w-20 pl-2! pr-4 text-right">
                      <span className="sr-only">관리</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell className="whitespace-normal break-words font-medium">
                      {book.title}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words">
                      {book.author}
                    </TableCell>
                    <TableCell className="whitespace-normal break-words">
                      {book.publisher || "—"}
                    </TableCell>
                    <TableCell className="whitespace-pre-wrap break-words text-muted-foreground">
                      {book.note || "—"}
                    </TableCell>
                    {canManage && (
                      <TableCell className="pl-2! pr-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            title="도서 수정"
                            aria-label={`${book.title} 수정`}
                            onClick={() => openEditDialog(book)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            title="도서 삭제"
                            aria-label={`${book.title} 삭제`}
                            onClick={() => setDeleteTarget(book)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        실제 이용 가능 여부는 학회실에서 확인해주세요.
      </p>

      <Dialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBook ? "도서 수정" : "도서 등록"}</DialogTitle>
            <DialogDescription>
              {editingBook
                ? "등록된 도서 정보를 수정합니다."
                : "학회에서 보유한 도서 정보를 입력합니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="book-title">도서명 *</Label>
              <Input
                id="book-title"
                maxLength={200}
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-author">저자 *</Label>
              <Input
                id="book-author"
                maxLength={120}
                value={form.author}
                onChange={(event) =>
                  setForm((current) => ({ ...current, author: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-publisher">출판사 (선택)</Label>
              <Input
                id="book-publisher"
                maxLength={120}
                value={form.publisher ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, publisher: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-description">설명 (선택)</Label>
              <Textarea
                id="book-description"
                rows={4}
                maxLength={2000}
                value={form.description ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="도서에 대한 간단한 설명을 입력하세요."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-quantity">보유 권수 *</Label>
              <Input
                id="book-quantity"
                type="number"
                min={1}
                max={999}
                value={form.quantity}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    quantity: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="book-note">비고 (선택)</Label>
              <Textarea
                id="book-note"
                rows={3}
                maxLength={1000}
                value={form.note ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, note: event.target.value }))
                }
                placeholder="판본이나 도서 상태 등 필요한 내용을 입력하세요."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setDialogOpen(false)}
            >
              취소
            </Button>
            <Button type="button" disabled={saving} onClick={handleSave}>
              {saving ? "저장 중..." : editingBook ? "수정" : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>도서를 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.title} 도서 정보가 목록에서 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? "삭제 중..." : "삭제"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
