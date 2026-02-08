"use client";

import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdvancedJsonSectionProps {
  jsonString: string;
  onJsonChange: (newJson: string) => void;
  isEditable?: boolean;
}

export function AdvancedJsonSection({
  jsonString,
  onJsonChange,
  isEditable = true,
}: AdvancedJsonSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editValue, setEditValue] = useState(jsonString);
  const [error, setError] = useState<string | null>(null);

  function handleCopy() {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFormat() {
    try {
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      onJsonChange(formatted);
      setEditValue(formatted);
      setError(null);
    } catch (err) {
      setError("JSON 형식이 올바르지 않아요.");
    }
  }

  function handleSaveJson() {
    try {
      // Validate JSON
      JSON.parse(editValue);
      onJsonChange(editValue);
      setError(null);
      setIsEditing(false);
    } catch (err) {
      setError("JSON 형식이 올바르지 않아요. 저장할 수 없어요.");
    }
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border-2 border-dashed bg-muted/30 p-4">
        <div className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-between p-0 h-auto font-semibold"
            >
              <span>개발자 설정 (JSON)</span>
              <span className="text-sm text-muted-foreground">
                {isOpen ? "접기" : "펼치기"}
              </span>
            </Button>
          </CollapsibleTrigger>
          <p className="text-xs text-muted-foreground">
            대부분의 사용자는 이 섹션을 편집할 필요가 없습니다. 위의 시각적
            편집기를 사용하세요.
          </p>
        </div>

        <CollapsibleContent className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {isEditable && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="json-edit"
                    checked={isEditing}
                    onCheckedChange={(checked) => {
                      setIsEditing(checked);
                      if (checked) {
                        setEditValue(jsonString);
                      }
                    }}
                  />
                  <Label htmlFor="json-edit" className="cursor-pointer">
                    JSON 편집
                  </Label>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    복사
                  </>
                )}
              </Button>
              {isEditable && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFormat}
                >
                  포맷 정리
                </Button>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="font-mono min-h-80 resize-none"
                placeholder='{"version": 1, "questions": []}'
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setEditValue(jsonString);
                    setError(null);
                  }}
                >
                  취소
                </Button>
                <Button type="button" size="sm" onClick={handleSaveJson}>
                  적용
                </Button>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-80 w-full rounded-md border bg-muted/50">
              <pre className="p-4 text-sm font-mono">{jsonString}</pre>
            </ScrollArea>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
