"use client";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Type,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConceptEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function ConceptEditor({ value, onChange }: ConceptEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
        trailingNode: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
      Placeholder.configure({
        placeholder: "Texto da página individual. Se vazio, a seção não aparece.",
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        "aria-label": "Conceito do case",
        class: "min-h-48 px-3 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor: instance }) => {
      onChange(instance.isEmpty ? "" : instance.getHTML());
    },
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const incoming = value || "";
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (incoming !== current) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [value, editor]);

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-transparent">
      {editor ? <Toolbar editor={editor} /> : null}
      <EditorContent editor={editor} className="case-prose" />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link", previous || "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  return (
    <div className="flex flex-wrap gap-1 border-b border-input p-2">
      <ToolButton pressed={editor.isActive("paragraph")} label="Parágrafo" onClick={() => editor.chain().focus().setParagraph().run()}>
        <Type />
      </ToolButton>
      <ToolButton pressed={editor.isActive("heading", { level: 2 })} label="Título" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 />
      </ToolButton>
      <ToolButton pressed={editor.isActive("heading", { level: 3 })} label="Subtítulo" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3 />
      </ToolButton>
      <ToolButton pressed={editor.isActive("bold")} label="Negrito" onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold />
      </ToolButton>
      <ToolButton pressed={editor.isActive("italic")} label="Itálico" onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic />
      </ToolButton>
      <ToolButton pressed={editor.isActive("bulletList")} label="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List />
      </ToolButton>
      <ToolButton pressed={editor.isActive("orderedList")} label="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered />
      </ToolButton>
      <ToolButton pressed={editor.isActive("blockquote")} label="Citação" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote />
      </ToolButton>
      <ToolButton pressed={editor.isActive("link")} label="Link" onClick={setLink}>
        <LinkIcon />
      </ToolButton>
    </div>
  );
}

function ToolButton({
  pressed,
  label,
  onClick,
  children,
}: {
  pressed: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="ghost"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={onClick}
      className={cn(pressed && "bg-muted text-foreground")}
    >
      {children}
    </Button>
  );
}
