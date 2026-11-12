"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

type DashboardThemeProviderProps = {
  children: ReactNode;
};

export function DashboardThemeProvider({ children }: DashboardThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
}
