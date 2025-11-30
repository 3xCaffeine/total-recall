import { JournalHeader } from "@/components/journal";
import { FocusTimer } from "@/components/focus";

export default function FocusPage() {
  return (
    <div className="flex flex-col h-screen">
      <JournalHeader title="Focus" />
      <main className="flex-1 overflow-hidden">
        <FocusTimer />
      </main>
    </div>
  );
}
