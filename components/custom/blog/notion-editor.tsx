"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  createRef,
} from "react";
import { createPortal } from "react-dom";
import {
  useEditor,
  EditorContent,
  Extension,
  type Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import ImageExtension from "@tiptap/extension-image";
import Suggestion from "@tiptap/suggestion";
import { marked } from "marked";
import {
  Bold,
  Italic,
  Code,
  Link2,
  ImageIcon,
  Loader2,
  Strikethrough,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code2,
  Image as ImageLucide,
  AlignLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Markdown ↔ HTML (I/O only, never during editing) ────────────────────────

function mdToHtml(md: string): string {
  if (!md.trim()) return "";
  return marked(md, { async: false }) as string;
}

function htmlToMd(html: string): string {
  if (!html || !html.trim()) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return walk(div).replace(/\n{3,}/g, "\n\n").trim();
}

function walk(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE)
    return (node.textContent ?? "").replace(/\n/g, " ");
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const ch = () => Array.from(el.childNodes).map(walk).join("");

  switch (tag) {
    case "h1": return `# ${ch()}\n\n`;
    case "h2": return `## ${ch()}\n\n`;
    case "h3": return `### ${ch()}\n\n`;
    case "p": {
      const c = ch();
      if (!c.trim()) return "";
      return el.parentElement?.tagName.toLowerCase() === "li" ? c : `${c}\n\n`;
    }
    case "strong": case "b": return `**${ch()}**`;
    case "em": case "i": return `*${ch()}*`;
    case "s": case "del": case "strike": return `~~${ch()}~~`;
    case "code":
      return el.closest("pre")
        ? (el.textContent ?? "")
        : `\`${el.textContent ?? ""}\``;
    case "pre": {
      const code = el.querySelector("code");
      const lang = code?.className?.match(/language-(\w+)/)?.[1] ?? "";
      return `\`\`\`${lang}\n${code?.textContent ?? ""}\n\`\`\`\n\n`;
    }
    case "ul":
      return (
        Array.from(el.children)
          .map((li) => `- ${walkLi(li as HTMLElement)}`)
          .join("\n") + "\n\n"
      );
    case "ol":
      return (
        Array.from(el.children)
          .map((li, i) => `${i + 1}. ${walkLi(li as HTMLElement)}`)
          .join("\n") + "\n\n"
      );
    case "blockquote": {
      const inner = ch().trim();
      return (
        inner.split("\n").filter(Boolean).map((l) => `> ${l}`).join("\n") +
        "\n\n"
      );
    }
    case "hr": return "---\n\n";
    case "a": return `[${ch()}](${el.getAttribute("href") ?? ""})`;
    case "img":
      return `![${el.getAttribute("alt") ?? ""}](${el.getAttribute("src") ?? ""})\n\n`;
    case "br": return "\n";
    default: return ch();
  }
}

function walkLi(li: HTMLElement): string {
  return Array.from(li.childNodes)
    .map(walk)
    .join("")
    .replace(/\n+$/, "");
}

// ─── Slash command ────────────────────────────────────────────────────────────

interface SlashItem {
  label: string;
  description: string;
  icon: React.ReactNode;
  command: (editor: Editor) => void;
}

const SLASH_ITEMS: SlashItem[] = [
  {
    label: "본문",
    description: "일반 단락",
    icon: <AlignLeft className="h-4 w-4" />,
    command: (e) => e.chain().focus().clearNodes().run(),
  },
  {
    label: "제목 1",
    description: "큰 제목",
    icon: <Heading1 className="h-4 w-4" />,
    command: (e) => e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: "제목 2",
    description: "중간 제목",
    icon: <Heading2 className="h-4 w-4" />,
    command: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: "제목 3",
    description: "소제목",
    icon: <Heading3 className="h-4 w-4" />,
    command: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: "글머리 기호",
    description: "순서 없는 목록",
    icon: <List className="h-4 w-4" />,
    command: (e) => e.chain().focus().toggleBulletList().run(),
  },
  {
    label: "번호 목록",
    description: "순서 있는 목록",
    icon: <ListOrdered className="h-4 w-4" />,
    command: (e) => e.chain().focus().toggleOrderedList().run(),
  },
  {
    label: "인용구",
    description: "블록 인용",
    icon: <Quote className="h-4 w-4" />,
    command: (e) => e.chain().focus().toggleBlockquote().run(),
  },
  {
    label: "코드 블록",
    description: "코드 영역",
    icon: <Code2 className="h-4 w-4" />,
    command: (e) => e.chain().focus().toggleCodeBlock().run(),
  },
  {
    label: "구분선",
    description: "수평선",
    icon: <Minus className="h-4 w-4" />,
    command: (e) => e.chain().focus().setHorizontalRule().run(),
  },
];

// Dropdown rendered via portal (keeps it outside the editor DOM tree)
interface SlashMenuProps {
  items: SlashItem[];
  selectedIndex: number;
  position: { x: number; y: number };
  onSelect: (item: SlashItem) => void;
}

function SlashMenu({ items, selectedIndex, position, onSelect }: SlashMenuProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (items.length === 0) return null;

  return createPortal(
    <div
      ref={listRef}
      style={{ top: position.y, left: position.x }}
      className="fixed z-50 min-w-56 max-h-72 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-md py-1"
    >
      {items.map((item, i) => (
        <button
          key={item.label}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
          className={cn(
            "flex w-full items-center gap-3 px-3 py-2 text-sm transition-colors",
            i === selectedIndex
              ? "bg-accent text-accent-foreground"
              : "hover:bg-accent/50"
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md border bg-background text-muted-foreground shrink-0">
            {item.icon}
          </span>
          <span className="text-left">
            <span className="block font-medium leading-tight">{item.label}</span>
            <span className="block text-xs text-muted-foreground leading-tight">
              {item.description}
            </span>
          </span>
        </button>
      ))}
    </div>,
    document.body
  );
}

// Slash command Tiptap extension
function buildSlashExtension(
  onOpen: (props: { items: SlashItem[]; pos: { x: number; y: number } }) => void,
  onClose: () => void,
  onKeyDown: (e: KeyboardEvent) => boolean
) {
  return Extension.create({
    name: "slashCommand",
    addProseMirrorPlugins() {
      return [
        Suggestion({
          editor: this.editor,
          char: "/",
          allowSpaces: false,
          startOfLine: false,
          command({ editor, range, props }) {
            // Delete the slash + query text FIRST to avoid stale range after block change
            editor.chain().focus().deleteRange(range).run();
            (props as SlashItem).command(editor);
          },
          items({ query }) {
            const q = query.toLowerCase();
            return SLASH_ITEMS.filter(
              (i) =>
                i.label.toLowerCase().includes(q) ||
                i.description.toLowerCase().includes(q)
            );
          },
          render() {
            return {
              onStart(props) {
                const rect = props.clientRect?.();
                if (!rect) return;
                onOpen({
                  items: props.items as SlashItem[],
                  pos: { x: rect.left, y: rect.bottom + 4 },
                });
              },
              onUpdate(props) {
                const rect = props.clientRect?.();
                if (!rect) return;
                onOpen({
                  items: props.items as SlashItem[],
                  pos: { x: rect.left, y: rect.bottom + 4 },
                });
              },
              onKeyDown({ event }) {
                return onKeyDown(event);
              },
              onExit() {
                onClose();
              },
            };
          },
        }),
      ];
    },
  });
}

// ─── Extra keyboard shortcuts ─────────────────────────────────────────────────

const CustomShortcuts = Extension.create({
  name: "customShortcuts",
  addKeyboardShortcuts() {
    return {
      // Pressing Enter on an empty list item exits the list (one level per press)
      // instead of endlessly creating new empty list items — matches Notion's UX.
      Enter: () => {
        const { editor } = this;
        const { selection } = editor.state;
        const { $from, empty } = selection;
        if (!empty) return false;
        if ($from.parent.type.name !== "paragraph" || $from.parent.content.size > 0) {
          return false;
        }
        const grandParent = $from.node(-1);
        if (!grandParent || grandParent.type.name !== "listItem") return false;
        return editor.chain().focus().liftListItem("listItem").run();
      },
      "Mod-`": () => this.editor.chain().focus().toggleCode().run(),
      "Mod-Shift-s": () => this.editor.chain().focus().toggleStrike().run(),
      "Mod-k": () => {
        const { editor } = this;
        const prev =
          (editor.getAttributes("link").href as string | undefined) ?? "";
        const url = window.prompt("URL을 입력하세요:", prev || "https://");
        if (url === null) return true;
        if (!url.trim()) {
          editor.chain().focus().unsetLink().run();
          return true;
        }
        editor.chain().focus().setLink({ href: url.trim() }).run();
        return true;
      },
    };
  },
});

// ─── Toolbar button ───────────────────────────────────────────────────────────

function TBtn({
  active,
  onClick,
  title,
  disabled,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "px-2 py-1 rounded text-xs font-medium transition-colors disabled:opacity-40",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

const Sep = () => <div className="w-px h-4 bg-border mx-1 shrink-0" />;

// ─── NotionEditor ─────────────────────────────────────────────────────────────

interface NotionEditorProps {
  value: string;
  onChange: (md: string) => void;
  onImageUpload?: (file: File) => Promise<{ id: string; url: string }>;
  onImageUploaded?: (id: string, url: string) => void;
}

export function NotionEditor({
  value,
  onChange,
  onImageUpload,
  onImageUploaded,
}: NotionEditorProps) {
  const [uploading, setUploading] = useState(false);

  // Slash menu state
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashItems, setSlashItems] = useState<SlashItem[]>([]);
  const [slashPos, setSlashPos] = useState({ x: 0, y: 0 });
  const [slashIndex, setSlashIndex] = useState(0);

  // Stable refs
  const propsRef = useRef({ onImageUpload, onImageUploaded, onChange });
  useEffect(() => {
    propsRef.current = { onImageUpload, onImageUploaded, onChange };
  });

  const editorRef = useRef<Editor | null>(null);
  const lastHtml = useRef("");
  // Last markdown emitted BY the editor itself (via onChange). Used to tell
  // "value changed because we typed" apart from "value changed externally" —
  // mdToHtml(htmlToMd(x)) is not guaranteed to equal x byte-for-byte, so
  // comparing re-serialized HTML strings falsely treats our own edits as
  // external changes and resets the document (and cursor) on every keystroke.
  const lastMd = useRef("");

  // Slash callbacks (stable refs to avoid re-creating the extension)
  const slashCallbacksRef = useRef({
    onOpen: (_: { items: SlashItem[]; pos: { x: number; y: number } }) => {},
    onClose: () => {},
    onKeyDown: (_: KeyboardEvent) => false as boolean,
  });

  slashCallbacksRef.current = {
    onOpen({ items, pos }) {
      setSlashItems(items);
      setSlashPos(pos);
      setSlashIndex(0);
      setSlashOpen(true);
    },
    onClose() {
      setSlashOpen(false);
      setSlashItems([]);
      setSlashIndex(0);
    },
    onKeyDown(event) {
      if (!slashOpen) return false;
      if (event.key === "ArrowDown") {
        setSlashIndex((i) => (i + 1) % slashItems.length);
        return true;
      }
      if (event.key === "ArrowUp") {
        setSlashIndex((i) => (i - 1 + slashItems.length) % slashItems.length);
        return true;
      }
      if (event.key === "Enter") {
        const item = slashItems[slashIndex];
        if (item && editorRef.current) {
          // The suggestion plugin handles the command + range deletion
          // We just need to select the item — this is done via the command config
        }
        return false; // let suggestion plugin handle Enter
      }
      if (event.key === "Escape") {
        setSlashOpen(false);
        return true;
      }
      return false;
    },
  };

  // Stable slash extension (created once, uses ref callbacks)
  const slashExtensionRef = useRef(
    buildSlashExtension(
      (p) => slashCallbacksRef.current.onOpen(p),
      () => slashCallbacksRef.current.onClose(),
      (e) => slashCallbacksRef.current.onKeyDown(e)
    )
  );

  // Stable image upload
  const uploadFile = useCallback(async (file: File) => {
    if (!propsRef.current.onImageUpload) return;
    setUploading(true);
    try {
      const { id, url } = await propsRef.current.onImageUpload(file);
      propsRef.current.onImageUploaded?.(id, url);
      editorRef.current?.chain().focus().setImage({ src: url }).run();
    } finally {
      setUploading(false);
    }
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2 cursor-pointer",
        },
      }),
      Placeholder.configure({
        placeholder: "내용을 입력하거나 / 를 눌러 블록을 추가하세요",
        emptyEditorClass: "is-editor-empty",
      }),
      ImageExtension.configure({
        HTMLAttributes: { class: "max-w-full rounded-lg" },
      }),
      CustomShortcuts,
      slashExtensionRef.current,
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "outline-none min-h-72 prose prose-sm dark:prose-invert max-w-none",
      },
      handlePaste(view, event) {
        const imgItem = Array.from(event.clipboardData?.items ?? []).find(
          (i) => i.kind === "file" && i.type.startsWith("image/")
        );
        if (imgItem && propsRef.current.onImageUpload) {
          const file = imgItem.getAsFile();
          if (file) {
            event.preventDefault();
            uploadFile(file);
            return true;
          }
        }
        return false;
      },
      handleDrop(_view, event, _slice, moved) {
        if (moved) return false;
        const file = event.dataTransfer?.files[0];
        if (file?.type.startsWith("image/") && propsRef.current.onImageUpload) {
          event.preventDefault();
          uploadFile(file);
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      const html = editor.getHTML();
      if (html === lastHtml.current) return;
      lastHtml.current = html;
      const md = htmlToMd(html);
      lastMd.current = md;
      propsRef.current.onChange(md);
    },
  });

  useEffect(() => {
    editorRef.current = editor ?? null;
  }, [editor]);

  // Initial content
  useEffect(() => {
    if (!editor) return;
    const html = mdToHtml(value);
    lastHtml.current = html;
    lastMd.current = value;
    editor.commands.setContent(html, { emitUpdate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  // Sync on external value change (e.g. loading a different draft) —
  // skipped when `value` is just our own edit echoed back through the
  // parent's state, so typing never gets clobbered by a mid-edit reset.
  useEffect(() => {
    if (!editor) return;
    if (value === lastMd.current) return;
    const html = mdToHtml(value);
    lastHtml.current = html;
    lastMd.current = value;
    editor.commands.setContent(html, { emitUpdate: false });
  }, [value, editor]);

  // Slash item selected
  const handleSlashSelect = useCallback((item: SlashItem) => {
    const ed = editorRef.current;
    if (!ed) return;
    item.command(ed);
    setSlashOpen(false);
  }, []);

  // Link prompt
  const handleLink = useCallback(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const prev = (ed.getAttributes("link").href as string | undefined) ?? "";
    const url = window.prompt("URL을 입력하세요:", prev || "https://");
    if (url === null) return;
    if (!url.trim()) { ed.chain().focus().unsetLink().run(); return; }
    ed.chain().focus().setLink({ href: url.trim() }).run();
  }, []);

  // Image button
  const handleImageBtn = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = () => { const f = input.files?.[0]; if (f) uploadFile(f); };
    input.click();
  }, [uploadFile]);

  if (!editor) return null;

  return (
    <div className="flex flex-col">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b pb-2 mb-4">
        <TBtn active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().clearNodes().run()} title="본문">P</TBtn>
        <TBtn active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="제목 1">H1</TBtn>
        <TBtn active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="제목 2">H2</TBtn>
        <TBtn active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="제목 3">H3</TBtn>
        <TBtn active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="글머리 기호">•</TBtn>
        <TBtn active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="번호 목록">1.</TBtn>
        <TBtn active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="인용구">❝</TBtn>
        <TBtn active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="코드 블록">{"</>"}</TBtn>
        <Sep />
        <TBtn active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="굵게 (Ctrl+B)"><Bold className="h-3.5 w-3.5" /></TBtn>
        <TBtn active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="기울임 (Ctrl+I)"><Italic className="h-3.5 w-3.5" /></TBtn>
        <TBtn active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선 (Ctrl+Shift+S)"><Strikethrough className="h-3.5 w-3.5" /></TBtn>
        <TBtn active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()} title="인라인 코드 (Ctrl+`)"><Code className="h-3.5 w-3.5" /></TBtn>
        <TBtn active={editor.isActive("link")} onClick={handleLink} title="링크 (Ctrl+K)"><Link2 className="h-3.5 w-3.5" /></TBtn>
        <Sep />
        <TBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선"><Minus className="h-3.5 w-3.5" /></TBtn>
        {onImageUpload && (
          <TBtn onClick={handleImageBtn} title="이미지 업로드" disabled={uploading}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          </TBtn>
        )}
      </div>

      {/* ── Editor ───────────────────────────────────────────────────────── */}
      <EditorContent editor={editor} />

      {/* ── Slash menu ───────────────────────────────────────────────────── */}
      {slashOpen && (
        <SlashMenu
          items={slashItems}
          selectedIndex={slashIndex}
          position={slashPos}
          onSelect={handleSlashSelect}
        />
      )}

      {/* ── Hints ────────────────────────────────────────────────────────── */}
      <p className="mt-4 text-xs text-muted-foreground/40 px-0.5 select-none">
        <kbd className="font-mono">/</kbd> 블록변경 ·{" "}
        <kbd className="font-mono">Ctrl+B</kbd> 굵게 ·{" "}
        <kbd className="font-mono">Ctrl+I</kbd> 기울임 ·{" "}
        <kbd className="font-mono">Ctrl+K</kbd> 링크
      </p>
    </div>
  );
}
