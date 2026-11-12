import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardThemeProvider } from "@/components/dashboard/dashboard-theme-provider";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardThemeProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardThemeProvider>
  );
}
