import { JournalHeader } from "@/components/journal";

export default function ChatPage() {
  return (
    <>
      <JournalHeader title="Chat" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-center min-h-[50vh] rounded-xl bg-muted/50">
          <p className="text-muted-foreground">AI Chat coming soon...</p>
        </div>
      </div>
    </>
  );
}
