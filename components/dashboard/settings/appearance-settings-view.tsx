"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", description: "Bright dashboard surfaces." },
  { value: "dark", label: "Dark", description: "Dimmed surfaces for low light." },
  { value: "system", label: "System", description: "Match your device setting." }
] as const;

export function AppearanceSettingsView() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold">Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading appearance…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base font-semibold">Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {THEMES.map((item) => {
          const selected = theme === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setTheme(item.value)}
              className={cn(
                "border-border w-full rounded-lg border px-4 py-3 text-left transition-colors",
                selected ? "bg-muted" : "hover:bg-muted/50"
              )}>
              <Label className="pointer-events-none text-sm font-medium">{item.label}</Label>
              <p className="text-muted-foreground mt-1 text-xs">{item.description}</p>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
