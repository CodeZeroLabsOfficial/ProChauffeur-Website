"use client";

import { useEffect, type ReactNode } from "react";

export function LoginThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    root.classList.add("dark");
    return () => {
      if (!hadDark) root.classList.remove("dark");
    };
  }, []);

  return (
    <div className="dark bg-background text-foreground min-h-svh">{children}</div>
  );
}
