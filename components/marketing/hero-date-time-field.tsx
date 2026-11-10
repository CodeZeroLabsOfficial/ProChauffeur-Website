"use client";

import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";

import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const hours = Math.floor(index / 4);
  const minutes = (index % 4) * 15;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

type HeroDateTimeFieldProps = {
  id: string;
  label: string;
  value: Date;
  onChange: (next: Date) => void;
  minDate?: Date;
  className?: string;
};

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function snapTimeValue(date: Date) {
  const minutes = Math.round(date.getMinutes() / 15) * 15;
  const next = new Date(date);
  if (minutes === 60) {
    next.setHours(date.getHours() + 1, 0, 0, 0);
  } else {
    next.setMinutes(minutes, 0, 0);
  }
  return `${String(next.getHours()).padStart(2, "0")}:${String(next.getMinutes()).padStart(2, "0")}`;
}

function mergeDate(day: Date, current: Date) {
  const next = new Date(day);
  next.setHours(current.getHours(), current.getMinutes(), 0, 0);
  return next;
}

function mergeTime(current: Date, time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  const next = new Date(current);
  next.setHours(Number(hours) || 0, Number(minutes) || 0, 0, 0);
  return next;
}

export function HeroDateTimeField({
  id,
  label,
  value,
  onChange,
  minDate,
  className
}: HeroDateTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const today = startOfDay(new Date());
  const earliest = minDate ? startOfDay(minDate) : today;
  const time = snapTimeValue(value);

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
      <Label htmlFor={id} className="text-xs font-medium text-white/70">
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          type="button"
          className="h-auto w-full border-0 bg-transparent px-0 py-1 text-left text-sm font-medium text-white shadow-none outline-none hover:bg-transparent focus-visible:ring-0">
          {format(value, "EEE d MMM HH:mm")}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="dark w-auto border-white/10 bg-neutral-950/80 p-0 text-white shadow-2xl ring-white/10 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row">
            <div className="sm:border-white/10 sm:border-r">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                selected={value}
                onSelect={(day) => {
                  if (!day) return;
                  onChange(mergeDate(day, value));
                }}
                defaultMonth={value}
                startMonth={new Date(new Date().getFullYear(), 0)}
                endMonth={new Date(new Date().getFullYear() + 2, 11)}
                disabled={{ before: earliest }}
                className="bg-transparent [--cell-radius:0.5rem]"
                buttonVariant="ghost"
              />
            </div>

            <div className="border-white/10 flex w-full flex-col border-t sm:w-36 sm:border-t-0">
              <p className="px-3 pt-3 text-xs text-white/60">Time</p>
              <div
                ref={listRef}
                className="max-h-64 overflow-y-auto p-1 sm:max-h-[17.5rem]"
                role="listbox"
                aria-label="Time">
                {TIME_OPTIONS.map((option) => {
                  const isActive = option === time;
                  return (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center rounded-md px-3 py-2 text-left text-sm transition-colors",
                        isActive
                          ? "bg-white text-neutral-950"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      )}
                      onClick={() => onChange(mergeTime(value, option))}>
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
