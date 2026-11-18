"use client";

import { useEffect, useRef, useState } from "react";

import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, index) => index + 1);

type HeroHoursFieldProps = {
  id: string;
  value: number;
  onChange: (hours: number) => void;
  min?: number;
  max?: number;
  className?: string;
  variant?: "hero" | "plain";
};

export function HeroHoursField({
  id,
  value,
  onChange,
  min = 1,
  max = 24,
  className,
  variant = "hero"
}: HeroHoursFieldProps) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const isPlain = variant === "plain";
  const options = HOUR_OPTIONS.filter((hours) => hours >= min && hours <= max);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const frame = requestAnimationFrame(() => {
      const active = list.querySelector<HTMLElement>("[data-active=true]");
      if (!active) return;
      list.scrollTop = active.offsetTop - list.clientHeight / 2 + active.clientHeight / 2;
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <div className={cn("min-w-0", className)}>
      <Label
        htmlFor={id}
        className={cn(
          "text-xs font-medium",
          isPlain ? "text-muted-foreground" : "text-white/70"
        )}>
        Hours
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          type="button"
          className={cn(
            "h-auto w-full px-0 py-1 text-left text-sm font-medium shadow-none outline-none",
            isPlain
              ? "border-border bg-background hover:bg-muted border px-3 py-2"
              : "border-0 bg-transparent text-white hover:bg-transparent focus-visible:ring-0"
          )}>
          {value} hour{value === 1 ? "" : "s"}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn(
            "w-36 p-0 shadow-2xl",
            isPlain
              ? "border-border bg-background text-foreground"
              : "dark border-white/10 bg-neutral-950/80 text-white ring-white/10 backdrop-blur-xl"
          )}>
          <div
            ref={listRef}
            className="max-h-64 overflow-y-auto p-1"
            role="listbox"
            aria-label="Hours">
            {options.map((hours) => {
              const isActive = hours === value;
              return (
                <button
                  key={hours}
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  data-active={isActive ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors",
                    isPlain
                      ? isActive
                        ? "bg-foreground text-background"
                        : "hover:bg-muted"
                      : isActive
                        ? "bg-white text-neutral-950"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                  )}
                  onClick={() => {
                    onChange(hours);
                    setOpen(false);
                  }}>
                  {hours} hour{hours === 1 ? "" : "s"}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
