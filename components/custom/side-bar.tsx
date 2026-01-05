import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { House, Newspaper } from "lucide-react";

// This is sample data.
const data = {
  navMain: [
    {
      title: "활동",
      url: "/dashboard/activity",
      icon: House,
    },
    {
      title: "News",
      url: "/news",
      icon: Newspaper,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="px-4 py-3 text-lg font-bold">CATCH THEME</div>
      </SidebarHeader>
      <SidebarContent className="flex-1 px-2">
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarMenu key={item.title}>
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
