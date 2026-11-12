"use client";

import { useEffect, type ReactNode } from "react";

export function LoginThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("dark");
    return () => {
      root.classList.remove("dark", "light");
      root.style.colorScheme = "";
    };
  }, []);

  return (
    <div className="dark bg-background text-foreground min-h-svh">{children}</div>
  );
}
