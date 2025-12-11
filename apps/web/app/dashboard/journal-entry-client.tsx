"use client";

import { useCallback } from "react";

import { JournalEditor } from "@/components/journal";
import { useJournal } from "@/hooks/use-journal";

export function JournalEntryClient() {
  const { createEntry, isLoading } = useJournal();

  const handleSave = useCallback(async (content: string) => {
    const title = content.split('\n')[0]?.substring(0, 100) || 'Untitled Entry';
    
    // Detect user's timezone automatically
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    await createEntry({
      content,
      title,
      timezone, // Send user's timezone to backend
    });
  }, [createEntry]);

  return (
    <div className="h-full p-6 md:p-8">
      <JournalEditor onSave={handleSave} className="h-full" />
    </div>
  );
}
