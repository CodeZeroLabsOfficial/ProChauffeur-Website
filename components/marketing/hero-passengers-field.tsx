"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type PassengerCounts = {
  adults: number;
  childCount: number;
};

type HeroPassengersFieldProps = {
  id: string;
  adults: number;
  childCount: number;
  onChange: (next: PassengerCounts) => void;
  maxTotal?: number;
  className?: string;
  variant?: "hero" | "plain";
};

function formatSummary(adults: number, childCount: number) {
  const total = adults + childCount;
  if (childCount <= 0) {
    return `${adults} adult${adults === 1 ? "" : "s"}`;
  }
  return `${total} passenger${total === 1 ? "" : "s"}`;
}

function StepperRow({
  label,
  description,
  value,
  min,
  max,
  onChange,
  isPlain
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  isPlain: boolean;
}) {
  const buttonClass = cn(
    "inline-flex size-8 items-center justify-center rounded-md border text-sm transition-colors disabled:opacity-35",
    isPlain
      ? "border-border bg-muted/40 hover:bg-muted"
      : "border-white/15 bg-white/10 text-white hover:bg-white/15"
  );

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <p className={cn("text-sm font-medium", isPlain ? "text-foreground" : "text-white")}>
          {label}
        </p>
        <p className={cn("text-xs", isPlain ? "text-muted-foreground" : "text-white/55")}>
          {description}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          className={buttonClass}
          onClick={() => onChange(Math.max(min, value - 1))}>
          <Minus className="size-3.5" />
        </button>
        <span
          className={cn(
            "w-6 text-center text-sm font-medium tabular-nums",
            isPlain ? "text-foreground" : "text-white"
          )}>
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          className={buttonClass}
          onClick={() => onChange(Math.min(max, value + 1))}>
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export function HeroPassengersField({
  id,
  adults,
  childCount,
  onChange,
  maxTotal = 8,
  className,
  variant = "hero"
}: HeroPassengersFieldProps) {
  const [open, setOpen] = useState(false);
  const isPlain = variant === "plain";
  const maxAdults = Math.max(1, maxTotal - childCount);
  const maxChildren = Math.max(0, maxTotal - adults);

  return (
    <div className={cn("min-w-0", className)}>
      <Label
        htmlFor={id}
        className={cn(
          "text-xs font-medium",
          isPlain ? "text-muted-foreground" : "text-white/70"
        )}>
        Passengers
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
          {formatSummary(adults, childCount)}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn(
            "w-[min(92vw,20rem)] p-3 shadow-2xl",
            isPlain
              ? "border-border bg-background text-foreground"
              : "dark border-white/10 bg-neutral-950/80 text-white ring-white/10 backdrop-blur-xl"
          )}>
          <div className={cn("divide-y", isPlain ? "divide-border" : "divide-white/10")}>
            <StepperRow
              label="Adults"
              description="Aged 18+"
              value={adults}
              min={1}
              max={maxAdults}
              isPlain={isPlain}
              onChange={(next) => onChange({ adults: next, childCount })}
            />
            <StepperRow
              label="Children"
              description="Under 18"
              value={childCount}
              min={0}
              max={maxChildren}
              isPlain={isPlain}
              onChange={(next) => onChange({ adults, childCount: next })}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
