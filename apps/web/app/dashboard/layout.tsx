import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { DashboardProviders } from "./dashboard-providers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const user = {
    name: session.user.name || "User",
    email: session.user.email || "",
    avatar: session.user.image || "",
  };

  return <DashboardProviders user={user}>{children}</DashboardProviders>;
}
