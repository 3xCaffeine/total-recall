"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Save, Eye } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { useUnsavedChanges } from "./unsaved-changes-provider";

// Dynamic import to avoid SSR issues with the markdown editor
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse bg-muted/20" />
  ),
});

interface JournalEditorProps {
  initialContent?: string;
  onSave?: (content: string) => Promise<void>;
  className?: string;
}

export function JournalEditor({
  initialContent = "",
  onSave,
  className,
}: JournalEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [localUnsaved, setLocalUnsaved] = useState(false);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const { resolvedTheme } = useTheme();
  
  // Try to use context, fallback to local state if not available
  const unsavedContext = useUnsavedChanges();
  const hasUnsavedChanges = unsavedContext ? unsavedContext.hasUnsavedChanges : localUnsaved;
  const setHasUnsavedChanges = unsavedContext ? unsavedContext.setHasUnsavedChanges : setLocalUnsaved;

  // Word count (strip markdown syntax for more accurate count)
  const plainText = content
    .replace(/[#*_`~\[\]()>-]/g, "")
    .replace(/\n+/g, " ");
  const wordCount = plainText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
  const charCount = content.length;

  // Save functionality
  const saveContent = useCallback(async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave(content);
      setHasUnsavedChanges(false);
      toast.success("Entry saved");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  }, [content, onSave]);

  // Keyboard shortcut for save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveContent();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveContent]);

  // Warn before leaving page with unsaved changes (browser refresh/close only)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleChange = (value?: string) => {
    setContent(value || "");
    setHasUnsavedChanges(true);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Editor Area */}
      <div
        className="flex-1 relative overflow-hidden"
        data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}
      >
        <MDEditor
          value={content}
          onChange={handleChange}
          preview={previewMode}
          hideToolbar={true}
          visibleDragbar={false}
          textareaProps={{
            placeholder:
              "What's on your mind today?\n\nYou can use Markdown...",
          }}
          height="100%"
          className={cn(
            "bg-transparent! border-0! shadow-none! rounded-none!",
            "[&_.w-md-editor-content]:bg-transparent!",
            "[&_.w-md-editor-input]:bg-transparent!",
            "[&_.w-md-editor-preview]:bg-transparent!",
            "[&_.w-md-editor-text]:min-h-full!",
            "[&_.wmde-markdown]:bg-transparent!",
            "[&_textarea]:text-sm! [&_textarea]:leading-relaxed!",
            "[&_textarea]:font-normal! [&_textarea]:placeholder:text-muted-foreground/50!",
            "[&_.wmde-markdown]:text-foreground!",
            "[&_.w-md-editor]:border-0! [&_.w-md-editor]:shadow-none! [&_.w-md-editor]:rounded-none!",
            "[&_.w-md-editor-preview-wrapper]:p-0!",
            "[&_.w-md-editor-text-pre>code]:text-sm! [&_.w-md-editor-text-pre>code]:leading-relaxed!",
            "[&_.w-md-editor-text-pre>code]:font-normal!",
            "[&_.w-md-editor-area]:rounded-none!",
            "[&_.w-md-editor-content]:rounded-none!"
          )}
        />
      </div>

      {/* Footer with save status and word count */}
      <div className="flex flex-col gap-3 pt-4 border-t mt-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Stats - Full width on mobile, left side on desktop */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground sm:justify-start">
          <span>{wordCount} words</span>
          <span className="hidden sm:inline">{charCount} characters</span>
          {hasUnsavedChanges && (
            <span className="text-amber-500">• Unsaved</span>
          )}
        </div>

        {/* Actions - Full width on mobile, right side on desktop */}
        <div className="flex items-center justify-center gap-2 sm:justify-end">
          <Toggle
            aria-label="Toggle preview"
            pressed={previewMode === "preview"}
            onPressedChange={(pressed) => setPreviewMode(pressed ? "preview" : "edit")}
            size="sm"
          >
            <Eye className="size-4" />
            <span className="hidden sm:inline ml-1">Preview</span>
          </Toggle>

          <Button
            size="sm"
            onClick={saveContent}
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            <span className="hidden sm:inline ml-1">Save</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
