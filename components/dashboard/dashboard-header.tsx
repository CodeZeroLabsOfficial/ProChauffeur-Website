"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { ThemeSwitch } from "@/components/dashboard/theme-switch";
import { UserMenu } from "@/components/dashboard/user-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";

export function DashboardHeader() {
  const { toggleSidebar, open } = useSidebar();

  return (
    <header className="bg-background/40 sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b backdrop-blur-md">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={open ? "Collapse sidebar" : "Expand sidebar"}>
          {open ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <ThemeSwitch />
          <Separator
            orientation="vertical"
            className="mx-1 data-[orientation=vertical]:h-4 data-[orientation=vertical]:self-center"
          />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
