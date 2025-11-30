"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ListIcon,
  Calendar,
  NotebookPen,
  Settings,
  Focus,
  Brain,
  BotIcon,
  Share2
} from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useUnsavedChanges } from "./unsaved-changes-provider";

const navigationItems = [
  {
    title: "Journal",
    url: "/dashboard",
    icon: NotebookPen,
  },
  {
    title: "Tasks",
    url: "/dashboard/tasks",
    icon: ListIcon,
  },
  {
    title: "Calendar",
    url: "/dashboard/calendar",
    icon: Calendar,
  },
  {
    title: "Focus",
    url: "/dashboard/focus",
    icon: Focus,
  },
  {
    title: "Chat",
    url: "/dashboard/chat",
    icon: BotIcon,
  },
  {
    title: "Graph",
    url: "/dashboard/graph",
    icon: Share2,
  },
];

const secondaryItems = [
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

interface NavItemProps {
  item: { title: string; url: string; icon: React.ComponentType<{ className?: string }> };
  isActive: boolean;
}

function NavItem({ item, isActive }: NavItemProps) {
  const router = useRouter();
  const unsavedContext = useUnsavedChanges();

  const handleClick = (e: React.MouseEvent) => {
    if (unsavedContext?.hasUnsavedChanges) {
      e.preventDefault();
      unsavedContext.confirmNavigation(() => {
        router.push(item.url);
      });
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
      >
        <Link href={item.url} onClick={handleClick}>
          <item.icon className="size-4" />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function SidebarNavMain() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navigationItems.map((item) => (
        <NavItem
          key={item.title}
          item={item}
          isActive={pathname === item.url}
        />
      ))}
    </SidebarMenu>
  );
}

export function SidebarNavSecondary() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {secondaryItems.map((item) => (
        <NavItem
          key={item.title}
          item={item}
          isActive={pathname === item.url}
        />
      ))}
    </SidebarMenu>
  );
}

export function SidebarLogo() {
  const router = useRouter();
  const unsavedContext = useUnsavedChanges();

  const handleClick = (e: React.MouseEvent) => {
    if (unsavedContext?.hasUnsavedChanges) {
      e.preventDefault();
      unsavedContext.confirmNavigation(() => {
        router.push("/dashboard");
      });
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild>
          <Link href="/dashboard" onClick={handleClick}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Brain className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Total Recall</span>
              <span className="truncate text-xs text-muted-foreground">
                Journal
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
