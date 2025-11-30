"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

import { JournalEditor } from "@/components/journal";

export function JournalEntryClient() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async (content: string) => {
    // TODO: Implement actual save logic to backend
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      console.log("Saving content:", content.substring(0, 100) + "...");
      toast.success("Entry saved successfully");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error("Failed to save entry");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return (
    <div className="h-full p-6 md:p-8">
      <JournalEditor onSave={handleSave} className="h-full" />
    </div>
  );
}
