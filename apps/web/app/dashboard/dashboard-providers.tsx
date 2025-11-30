"use client";

import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { JournalSidebar, UnsavedChangesProvider } from "@/components/journal";

interface DashboardProvidersProps {
  children: ReactNode;
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}

export function DashboardProviders({ children, user }: DashboardProvidersProps) {
  return (
    <UnsavedChangesProvider>
      <SidebarProvider>
        <JournalSidebar user={user} />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </UnsavedChangesProvider>
  );
}
