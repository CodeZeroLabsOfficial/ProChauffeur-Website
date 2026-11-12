"use client";

import type { CSSProperties, ReactNode } from "react";

import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardAuthGate } from "@/components/dashboard/dashboard-auth-gate";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "16rem",
          "--header-height": "3.5rem"
        } as CSSProperties
      }>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <DashboardAuthGate>{children}</DashboardAuthGate>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
