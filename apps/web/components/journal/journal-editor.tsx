"use client";

import * as React from "react";
import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Loader2, Save, Eye, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <HelpCircle className="size-4" />
                <span className="hidden sm:inline ml-1">Help</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-lg p-0">
              <SheetHeader className="px-6 pt-6 pb-4 border-b">
                <SheetTitle className="text-lg">Markdown Guide</SheetTitle>
                <SheetDescription>
                  Format your thoughts beautifully
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-7rem)]">
                <div className="px-6 py-6 space-y-8">
                  {/* Headers */}
                  <section className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Headers</h4>
                    <div className="space-y-4">
                      <div className="flex items-baseline justify-between gap-4">
                        <code className="text-xs text-muted-foreground font-mono shrink-0"># Title</code>
                        <span className="text-2xl font-bold tracking-tight">Title</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <code className="text-xs text-muted-foreground font-mono shrink-0">## Section</code>
                        <span className="text-xl font-semibold">Section</span>
                      </div>
                      <div className="flex items-baseline justify-between gap-4">
                        <code className="text-xs text-muted-foreground font-mono shrink-0">### Subsection</code>
                        <span className="text-lg font-medium">Subsection</span>
                      </div>
                    </div>
                  </section>

                  <div className="border-t" />

                  {/* Emphasis */}
                  <section className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Emphasis</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <code className="text-xs text-muted-foreground font-mono">*italic*</code>
                        <span className="text-sm italic">italic</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <code className="text-xs text-muted-foreground font-mono">**bold**</code>
                        <span className="text-sm font-bold">bold</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <code className="text-xs text-muted-foreground font-mono">***bold italic***</code>
                        <span className="text-sm font-bold italic">bold italic</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <code className="text-xs text-muted-foreground font-mono">~~strikethrough~~</code>
                        <span className="text-sm line-through">strikethrough</span>
                      </div>
                    </div>
                  </section>

                  <div className="border-t" />

                  {/* Lists */}
                  <section className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lists</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-mono">- Item<br />- Item<br />  - Nested</p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>• Item</p>
                        <p>• Item</p>
                        <p className="pl-4">◦ Nested</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-2">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-mono">1. First<br />2. Second</p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>1. First</p>
                        <p>2. Second</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 pt-2">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-mono">- [ ] Todo<br />- [x] Done</p>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <p className="flex items-center gap-2">
                          <span className="size-4 rounded border border-muted-foreground/30" />
                          Todo
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="size-4 rounded bg-primary flex items-center justify-center text-primary-foreground text-[10px]">✓</span>
                          Done
                        </p>
                      </div>
                    </div>
                  </section>

                  <div className="border-t" />

                  {/* Links & Images */}
                  <section className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Links & Images</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <code className="text-xs text-muted-foreground font-mono">[text](url)</code>
                        <span className="text-sm text-primary underline underline-offset-2">text</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <code className="text-xs text-muted-foreground font-mono">![alt](src)</code>
                        <span className="text-xs text-muted-foreground">Embeds image</span>
                      </div>
                    </div>
                  </section>

                  <div className="border-t" />

                  {/* Code */}
                  <section className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <code className="text-xs text-muted-foreground font-mono">`inline`</code>
                        <code className="text-sm bg-muted px-1.5 py-0.5 rounded">inline</code>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-mono">```js<br />code<br />```</p>
                        <div className="bg-muted rounded-md p-3 text-sm font-mono">
                          code
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="border-t" />

                  {/* Blockquote */}
                  <section className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Blockquote</h4>
                    <div className="space-y-3">
                      <code className="text-xs text-muted-foreground font-mono block">&gt; Quoted text</code>
                      <blockquote className="border-l-2 border-primary/50 pl-4 text-sm italic text-muted-foreground">
                        Quoted text
                      </blockquote>
                    </div>
                  </section>

                  <div className="border-t" />

                  {/* Divider */}
                  <section className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Divider</h4>
                    <div className="space-y-3">
                      <code className="text-xs text-muted-foreground font-mono">---</code>
                      <hr className="border-t" />
                    </div>
                  </section>

                  <div className="border-t" />

                  {/* Keyboard Shortcuts */}
                  <section className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Shortcuts</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Save entry</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">⌘/Ctrl + S</kbd>
                    </div>
                  </section>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

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
