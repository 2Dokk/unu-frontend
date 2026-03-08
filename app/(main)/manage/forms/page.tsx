"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  SquarePlus,
} from "lucide-react";
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
import {} from "@/components/ui/alert-dialog";
import { DeleteConfirmDialog } from "@/components/custom/common/delete-confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getAllFormTemplates,
  deleteFormTemplate,
} from "@/lib/api/form-template";
import { getAllForms, deleteForm } from "@/lib/api/form";
import { FormTemplateResponse, FormResponse } from "@/lib/interfaces/form";
import { formatDate } from "@/lib/utils/date-utils";

export default function AdminFormsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("forms");

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
    id: string;
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
    } catch (error: any) {
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
    } catch (error: any) {
      console.error("Failed to load forms:", error);
    } finally {
      setFormsLoading(false);
    }
  }

  function confirmDelete(type: "template" | "form", id: string, title: string) {
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
    } catch (error: any) {
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

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">신청서 관리</h1>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
          신청서와 템플릿을 관리합니다
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="forms" className="px-4 py-2">
            신청서
          </TabsTrigger>
          <TabsTrigger value="templates" className="px-4 py-2">
            신청서 템플릿
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>신청서 템플릿 목록</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/manage/forms/templates/new")}
                >
                  <Plus className="h-3 w-3" />
                  <span className="text-xs">템플릿 생성</span>
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
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {templateSearch
                    ? "검색 결과가 없습니다"
                    : "아직 템플릿이 없습니다"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>제목</TableHead>
                      <TableHead className="text-center">수정일</TableHead>
                      <TableHead className="w-25 text-center">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow
                        key={template.id}
                        onClick={() =>
                          router.push(`/manage/forms/templates/${template.id}`)
                        }
                      >
                        <TableCell className="font-medium">
                          {template.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm text-center">
                          {formatDate(template.modifiedAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/manage/forms/templates/${template.id}/edit`,
                                  );
                                }}
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
                                <Trash2 className="mr-2 h-4 w-4 text-destructive" />
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
                <CardTitle>신청서 목록</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push("/manage/forms/new")}
                >
                  <Plus className="h-3 w-3" />
                  <span className="text-xs">신청서 생성</span>
                </Button>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="신청서 제목 검색..."
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
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {formSearch
                    ? "검색 결과가 없습니다"
                    : "아직 신청서가 없습니다"}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>제목</TableHead>
                      <TableHead className="text-center">템플릿</TableHead>
                      <TableHead className="text-center">수정일</TableHead>
                      <TableHead className="w-25 text-center">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredForms.map((form) => (
                      <TableRow
                        key={form.id}
                        onClick={() => router.push(`/manage/forms/${form.id}`)}
                      >
                        <TableCell className="font-medium">
                          {form.title}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {form.template?.title || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm text-center">
                          {formatDate(form.modifiedAt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  router.push(`/manage/forms/${form.id}/edit`);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                수정
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation();
                                  confirmDelete("form", form.id, form.title);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4 text-destructive" />
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

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemValue={itemToDelete?.title || ""}
        onConfirm={handleDelete}
      />
    </div>
  );
}
