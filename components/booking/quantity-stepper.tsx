"use client";

import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuantityStepperProps = {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
};

export function QuantityStepper({
  id,
  label,
  value,
  min = 0,
  max = 20,
  onChange,
  className
}: QuantityStepperProps) {
  return (
    <div className={cn("border-border flex items-center justify-between gap-4 border px-4 py-3", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}>
          <Minus />
        </Button>
        <span id={id} className="w-8 text-center text-sm font-medium tabular-nums">
          {value}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}>
          <Plus />
        </Button>
      </div>
    </div>
  );
}
