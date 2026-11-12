"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const THEMES = [
  {
    value: "light",
    label: "Light",
    preview: (
      <div className="items-center rounded-lg border-2 p-1 hover:border-accent">
        <div className="space-y-2 rounded-lg bg-[#ecedef] p-2">
          <div className="space-y-2 rounded-md bg-white p-2 shadow-xs">
            <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-xs">
            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-xs">
            <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
            <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
          </div>
        </div>
      </div>
    )
  },
  {
    value: "dark",
    label: "Dark",
    preview: (
      <div className="bg-popover items-center rounded-lg border-2 p-1 hover:bg-accent hover:text-accent-foreground">
        <div className="space-y-2 rounded-lg bg-slate-950 p-2">
          <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-xs">
            <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-xs">
            <div className="h-4 w-4 rounded-full bg-slate-400" />
            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
          </div>
          <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-xs">
            <div className="h-4 w-4 rounded-full bg-slate-400" />
            <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
          </div>
        </div>
      </div>
    )
  },
  {
    value: "system",
    label: "System",
    preview: (
      <div className="items-center rounded-lg border-2 p-1 hover:border-accent">
        <div className="grid grid-cols-2 overflow-hidden rounded-lg">
          <div className="space-y-2 bg-[#ecedef] p-2">
            <div className="space-y-2 rounded-md bg-white p-2 shadow-xs">
              <div className="h-2 w-[40px] rounded-lg bg-[#ecedef]" />
              <div className="h-2 w-[50px] rounded-lg bg-[#ecedef]" />
            </div>
          </div>
          <div className="space-y-2 bg-slate-950 p-2">
            <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-xs">
              <div className="h-2 w-[40px] rounded-lg bg-slate-400" />
              <div className="h-2 w-[50px] rounded-lg bg-slate-400" />
            </div>
          </div>
        </div>
      </div>
    )
  }
] as const;

export function AppearanceSettingsView() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="w-full">
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading appearance…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent>
        <div className="space-y-1">
          <Label>Theme</Label>
          <p className="text-muted-foreground text-sm">Select the theme for the dashboard.</p>
          <div className="flex max-w-md flex-wrap gap-6 pt-2">
            {THEMES.map((item) => {
              const selected = theme === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setTheme(item.value)}
                  className={cn(
                    "flex flex-col items-center",
                    selected && "[&>div]:border-primary"
                  )}>
                  {item.preview}
                  <span className="block w-full p-2 text-center text-sm font-normal">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
