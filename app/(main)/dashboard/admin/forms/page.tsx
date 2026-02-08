"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MoreVertical, Eye, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAllFormTemplates,
  deleteFormTemplate,
} from "@/lib/api/form-template";
import { getAllForms, deleteForm } from "@/lib/api/form";
import { FormTemplateResponse, FormResponse } from "@/lib/interfaces/form";

export default function AdminFormsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("templates");

  // Templates state
  const [templates, setTemplates] = useState<FormTemplateResponse[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateSearch, setTemplateSearch] = useState("");

  // Forms state
  const [forms, setForms] = useState<FormResponse[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [formSearch, setFormSearch] = useState("");

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "template" | "form";
    id: number;
    title: string;
  } | null>(null);

  useEffect(() => {
    loadTemplates();
    loadForms();
  }, []);

  async function loadTemplates() {
    try {
      setTemplatesLoading(true);
      const data = await getAllFormTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setTemplatesLoading(false);
    }
  }

  async function loadForms() {
    try {
      setFormsLoading(true);
      const data = await getAllForms();
      setForms(data);
    } catch (error) {
      console.error("Failed to load forms:", error);
    } finally {
      setFormsLoading(false);
    }
  }

  function confirmDelete(type: "template" | "form", id: number, title: string) {
    setItemToDelete({ type, id, title });
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "template") {
        await deleteFormTemplate(itemToDelete.id);
        await loadTemplates();
      } else {
        await deleteForm(itemToDelete.id);
        await loadForms();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  }

  const filteredTemplates = templates.filter((t) =>
    t.title.toLowerCase().includes(templateSearch.toLowerCase()),
  );

  const filteredForms = forms.filter((f) =>
    f.title.toLowerCase().includes(formSearch.toLowerCase()),
  );

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">폼 관리</h1>
        <p className="text-muted-foreground mt-2">
          템플릿과 폼을 생성하고 관리하세요
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">템플릿</TabsTrigger>
          <TabsTrigger value="forms">폼</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>템플릿 목록</CardTitle>
                <Button
                  onClick={() =>
                    router.push("/dashboard/admin/forms/templates/new")
                  }
                >
                  <Plus className="mr-2 h-4 w-4" />새 템플릿
                </Button>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="템플릿 제목 검색..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {templatesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {templateSearch
                    ? "검색 결과가 없어요."
                    : "아직 템플릿이 없어요."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>제목</TableHead>
                      <TableHead>수정일</TableHead>
                      <TableHead className="w-25">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className="font-medium">
                          {template.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(template.modifiedAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/forms/templates/${template.id}`,
                                  )
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                보기
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/forms/templates/${template.id}/edit`,
                                  )
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  confirmDelete(
                                    "template",
                                    template.id,
                                    template.title,
                                  )
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forms Tab */}
        <TabsContent value="forms" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>폼 목록</CardTitle>
                <Button
                  onClick={() => router.push("/dashboard/admin/forms/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />새 폼
                </Button>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="폼 제목 검색..."
                  value={formSearch}
                  onChange={(e) => setFormSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </CardHeader>
            <CardContent>
              {formsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredForms.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {formSearch ? "검색 결과가 없어요." : "아직 폼이 없어요."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>제목</TableHead>
                      <TableHead>템플릿</TableHead>
                      <TableHead>수정일</TableHead>
                      <TableHead className="w-25">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredForms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">
                          {form.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {form.template.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(form.modifiedAt)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/forms/${form.id}`,
                                  )
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                보기
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/admin/forms/${form.id}/edit`,
                                  )
                                }
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  confirmDelete("form", form.id, form.title)
                                }
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                삭제
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>정말 삭제하시겠어요?</AlertDialogTitle>
            <AlertDialogDescription>
              {itemToDelete?.type === "template" ? "템플릿" : "폼"} "
              {itemToDelete?.title}"을(를) 삭제하면 되돌릴 수 없어요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
