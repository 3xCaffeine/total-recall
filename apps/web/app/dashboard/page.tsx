import { JournalHeader, DateDisplay } from "@/components/journal";
import { JournalEntryClient } from "./journal-entry-client";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-screen">
      <JournalHeader title="Today's Entry" />

      <main className="flex-1 overflow-hidden">
        <div className="h-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto px-6 py-8 md:px-8 lg:px-12">
          {/* Date and metadata section */}
          <div className="mb-8">
            <DateDisplay showWeather={true} />
          </div>

          {/* Journal writing area */}
          <div className="h-[calc(100%-8rem)]">
            <JournalEntryClient />
          </div>
        </div>
      </main>
    </div>
  );
}
