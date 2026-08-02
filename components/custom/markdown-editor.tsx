"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  Code,
  Quote,
  List,
  ListOrdered,
  Link,
  ImageIcon,
  Minus,
  Eye,
  PenLine,
  Columns2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ViewMode = "write" | "split" | "preview";

type ToolbarItem =
  | { kind: "wrap"; icon: React.ReactNode; label: string; before: string; after: string; placeholder?: string; kbd?: string }
  | { kind: "line"; icon: React.ReactNode; label: string; prefix: string }
  | { kind: "block"; icon: React.ReactNode; label: string; template: string }
  | { kind: "sep" };

// ---------------------------------------------------------------------------
// Toolbar config
// ---------------------------------------------------------------------------
const TOOLBAR: ToolbarItem[] = [
  { kind: "line",  icon: <Heading1 className="h-3.5 w-3.5" />, label: "Heading 1", prefix: "# " },
  { kind: "line",  icon: <Heading2 className="h-3.5 w-3.5" />, label: "Heading 2", prefix: "## " },
  { kind: "line",  icon: <Heading3 className="h-3.5 w-3.5" />, label: "Heading 3", prefix: "### " },
  { kind: "sep" },
  { kind: "wrap",  icon: <Bold className="h-3.5 w-3.5" />,     label: "Bold",   before: "**", after: "**", placeholder: "bold text", kbd: "b" },
  { kind: "wrap",  icon: <Italic className="h-3.5 w-3.5" />,   label: "Italic", before: "_",  after: "_",  placeholder: "italic text", kbd: "i" },
  { kind: "sep" },
  { kind: "wrap",  icon: <Code className="h-3.5 w-3.5" />,     label: "Inline code",  before: "`",   after: "`",   placeholder: "code" },
  { kind: "block", icon: <Code className="h-3.5 w-3.5" />,     label: "Code block",   template: "```\n{selection}\n```" },
  { kind: "sep" },
  { kind: "line",  icon: <Quote className="h-3.5 w-3.5" />,       label: "Blockquote",     prefix: "> " },
  { kind: "line",  icon: <List className="h-3.5 w-3.5" />,         label: "Bullet list",    prefix: "- " },
  { kind: "line",  icon: <ListOrdered className="h-3.5 w-3.5" />,  label: "Numbered list",  prefix: "1. " },
  { kind: "sep" },
  { kind: "wrap",  icon: <Link className="h-3.5 w-3.5" />,     label: "Link",  before: "[", after: "](url)", placeholder: "link text", kbd: "k" },
  { kind: "block", icon: <ImageIcon className="h-3.5 w-3.5" />, label: "Image", template: "![{selection}](url)" },
  { kind: "block", icon: <Minus className="h-3.5 w-3.5" />,     label: "Divider", template: "\n---\n" },
];

const VIEW_MODES: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  { mode: "write",   icon: <PenLine className="h-3.5 w-3.5" />,  label: "편집" },
  { mode: "split",   icon: <Columns2 className="h-3.5 w-3.5" />, label: "분할" },
  { mode: "preview", icon: <Eye className="h-3.5 w-3.5" />,      label: "미리보기" },
];

// ---------------------------------------------------------------------------
// MarkdownPreview (shared between this and detail pages)
// ---------------------------------------------------------------------------
export function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-3">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mt-6 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-1">{children}</h3>,
        p: ({ children }) => <p className="leading-7 mb-3">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-3">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-3">{children}</ol>,
        li: ({ children }) => <li className="leading-7">{children}</li>,
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          return isBlock ? (
            <code className="block bg-muted rounded-lg px-4 py-3 text-xs font-mono overflow-x-auto whitespace-pre">
              {children}
            </code>
          ) : (
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>
          );
        },
        pre: ({ children }) => <pre className="rounded-lg overflow-x-auto my-4">{children}</pre>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-border pl-4 text-muted-foreground italic my-3">{children}</blockquote>
        ),
        img: ({ src, alt }) =>
          src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt ?? ""} className="max-w-full rounded-lg my-3" />
          ) : null,
        a: ({ children, href }) => (
          <a href={href} className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        hr: () => <hr className="my-6 border-border" />,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        table: ({ children }) => (
          <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">{children}</table>
          </div>
        ),
        th: ({ children }) => <th className="border border-border px-3 py-1.5 bg-muted font-semibold text-left">{children}</th>,
        td: ({ children }) => <td className="border border-border px-3 py-1.5">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

// ---------------------------------------------------------------------------
// MarkdownEditor
// ---------------------------------------------------------------------------
interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Called with a File; should return { id, url } of the uploaded image. */
  onImageUpload?: (file: File) => Promise<{ id: string; url: string }>;
  /** Called after successful upload with (id, url) — use for thumbnail tracking. */
  onImageUploaded?: (id: string, url: string) => void;
  minHeight?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "마크다운으로 작성하세요…",
  onImageUpload,
  onImageUploaded,
  minHeight = 480,
}: MarkdownEditorProps) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [mode, setMode] = useState<ViewMode>("split");
  const [uploading, setUploading] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, minHeight)}px`;
  }, [value, mode, minHeight]);

  // -------------------------------------------------------------------------
  // Cursor helpers
  // -------------------------------------------------------------------------
  const applyToTextarea = useCallback(
    (newValue: string, selectStart: number, selectEnd: number) => {
      onChange(newValue);
      requestAnimationFrame(() => {
        const ta = taRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(selectStart, selectEnd);
      });
    },
    [onChange],
  );

  const wrapSelection = useCallback(
    (before: string, after: string, placeholder = "") => {
      const ta = taRef.current;
      if (!ta) return;
      const { selectionStart: s, selectionEnd: e } = ta;
      const selected = value.slice(s, e) || placeholder;
      const next = value.slice(0, s) + before + selected + after + value.slice(e);
      applyToTextarea(next, s + before.length, s + before.length + selected.length);
    },
    [value, applyToTextarea],
  );

  const prefixLine = useCallback(
    (prefix: string) => {
      const ta = taRef.current;
      if (!ta) return;
      const s = ta.selectionStart;
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
      applyToTextarea(next, s + prefix.length, s + prefix.length);
    },
    [value, applyToTextarea],
  );

  const insertBlock = useCallback(
    (template: string) => {
      const ta = taRef.current;
      if (!ta) return;
      const { selectionStart: s, selectionEnd: e } = ta;
      const selected = value.slice(s, e);
      const text = template.replace("{selection}", selected || "");
      const next = value.slice(0, s) + text + value.slice(e);
      applyToTextarea(next, s + text.length, s + text.length);
    },
    [value, applyToTextarea],
  );

  const insertImageMarkdown = useCallback(
    (url: string) => {
      const ta = taRef.current;
      if (!ta) return;
      // Read from DOM — avoids stale closure when called from async FileReader/onImageUpload
      const current = ta.value;
      const s = ta.selectionStart ?? current.length;
      const md = `\n![image](${url})\n`;
      const next = current.slice(0, s) + md + current.slice(s);
      onChange(next);
      requestAnimationFrame(() => {
        const el = taRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(s + md.length, s + md.length);
      });
    },
    [onChange],
  );

  // -------------------------------------------------------------------------
  // Toolbar click
  // -------------------------------------------------------------------------
  const handleToolbar = useCallback(
    (item: ToolbarItem) => {
      if (item.kind === "sep") return;
      if (item.kind === "wrap")  wrapSelection(item.before, item.after, item.placeholder);
      if (item.kind === "line")  prefixLine(item.prefix);
      if (item.kind === "block") insertBlock(item.template);
    },
    [wrapSelection, prefixLine, insertBlock],
  );

  // -------------------------------------------------------------------------
  // Keyboard shortcuts
  // -------------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const mod = e.ctrlKey || e.metaKey;
      if (e.key === "Tab") {
        e.preventDefault();
        wrapSelection("  ", "");
        return;
      }
      if (!mod) return;
      const hit = TOOLBAR.find((t) => t.kind === "wrap" && t.kbd === e.key.toLowerCase());
      if (hit && hit.kind === "wrap") {
        e.preventDefault();
        wrapSelection(hit.before, hit.after, hit.placeholder);
      }
    },
    [wrapSelection],
  );

  // -------------------------------------------------------------------------
  // Image paste / drop
  // -------------------------------------------------------------------------
  const processImageFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        if (onImageUpload) {
          const { id, url } = await onImageUpload(file);
          onImageUploaded?.(id, url);
          insertImageMarkdown(url);
        } else {
          // Fallback: object URL (valid for this browser session only)
          const blobUrl = URL.createObjectURL(file);
          insertImageMarkdown(blobUrl);
        }
      } finally {
        setUploading(false);
      }
    },
    [onImageUpload, onImageUploaded, insertImageMarkdown],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find(
        (item) => item.kind === "file" && item.type.startsWith("image/"),
      );
      if (!imageItem) return;
      const file = imageItem.getAsFile();
      if (!file) return;
      e.preventDefault();
      processImageFile(file);
    },
    [processImageFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      e.preventDefault();
      const imageFile = Array.from(e.dataTransfer.files).find((f) =>
        f.type.startsWith("image/"),
      );
      if (!imageFile) return;
      processImageFile(imageFile);
    },
    [processImageFile],
  );

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="border rounded-xl overflow-hidden bg-background">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-2 py-1.5">
        {TOOLBAR.map((item, idx) =>
          item.kind === "sep" ? (
            <div key={idx} className="w-px h-4 bg-border mx-0.5" />
          ) : (
            <button
              key={idx}
              type="button"
              title={item.label}
              onMouseDown={(e) => {
                e.preventDefault(); // keep textarea focus
                handleToolbar(item);
              }}
              className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              {item.icon}
            </button>
          ),
        )}

        <div className="flex-1" />

        {uploading && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mr-1" />
        )}

        {/* View mode */}
        <div className="flex items-center border rounded-md overflow-hidden">
          {VIEW_MODES.map(({ mode: m, icon, label }) => (
            <button
              key={m}
              type="button"
              title={label}
              onClick={() => setMode(m)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 text-xs transition-colors",
                mode === m
                  ? "bg-background text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Editor / Preview pane ── */}
      <div className={cn("flex", mode === "split" && "divide-x")} style={{ minHeight }}>
        {/* Editor */}
        {(mode === "write" || mode === "split") && (
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            placeholder={placeholder}
            className={cn(
              "bg-background px-4 py-3 text-sm font-mono resize-none focus:outline-none leading-7",
              mode === "split" ? "w-1/2" : "w-full",
            )}
            style={{ minHeight }}
          />
        )}

        {/* Preview */}
        {(mode === "preview" || mode === "split") && (
          <div
            className={cn(
              "px-5 py-4 overflow-auto text-sm",
              mode === "split" ? "w-1/2" : "w-full",
            )}
            style={{ minHeight }}
          >
            {value ? (
              <MarkdownPreview content={value} />
            ) : (
              <p className="text-muted-foreground text-sm">미리보기가 여기에 표시됩니다.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
