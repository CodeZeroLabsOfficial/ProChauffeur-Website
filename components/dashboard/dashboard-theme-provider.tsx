"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, type ReactNode } from "react";

type DashboardThemeProviderProps = {
  children: ReactNode;
};

function clearDocumentThemeClass() {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.style.colorScheme = "";
}

export function DashboardThemeProvider({ children }: DashboardThemeProviderProps) {
  useEffect(() => {
    return () => {
      clearDocumentThemeClass();
    };
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="dashboard-theme">
      {children}
    </ThemeProvider>
  );
}
