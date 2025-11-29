import { JournalHeader } from "@/components/journal";

export default function SettingsPage() {
  return (
    <>
      <JournalHeader title="Settings" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-center min-h-[50vh] rounded-xl bg-muted/50">
          <p className="text-muted-foreground">Settings coming soon...</p>
        </div>
      </div>
    </>
  );
}
