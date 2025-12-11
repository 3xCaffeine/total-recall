import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { JournalHeader } from "@/components/journal";
import { ChatClient } from "@/components/chat/chat-client";
import { auth } from "@/lib/auth";

export default async function ChatPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const userId = session!.user.id;

  return (
    <>
      <JournalHeader title="Chat" />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <ChatClient userId={userId} />
      </div>
    </>
  );
}
