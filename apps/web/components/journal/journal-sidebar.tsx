import { NavUser } from "@/components/journal/nav-user";
import { SidebarLogo, SidebarNavMain, SidebarNavSecondary } from "@/components/journal/sidebar-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";

interface JournalSidebarProps {
  user: {
    name: string;
    email: string;
    avatar: string;
  };
}

export function JournalSidebar({ user }: JournalSidebarProps) {
  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="h-16 border-b border-sidebar-border">
        <SidebarLogo />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNavMain />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Preferences</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarNavSecondary />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
