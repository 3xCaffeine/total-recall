import { JournalHeader } from "@/components/journal";

export default function CalendarPage() {
  return (
    <>
      <JournalHeader title="Calendar" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-center min-h-[50vh] rounded-xl bg-muted/50">
          <p className="text-muted-foreground">Calendar coming soon...</p>
        </div>
      </div>
    </>
  );
}
