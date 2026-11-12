"use client";

import { useState } from "react";
import {
  endOfDay,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths
} from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const dateFilterPresets = [
  { name: "Today", value: "today" },
  { name: "Yesterday", value: "yesterday" },
  { name: "This Week", value: "thisWeek" },
  { name: "Last 7 Days", value: "last7Days" },
  { name: "Last 28 Days", value: "last28Days" },
  { name: "This Month", value: "thisMonth" },
  { name: "Last Month", value: "lastMonth" },
  { name: "This Year", value: "thisYear" }
] as const;

export type DateRangePreset = (typeof dateFilterPresets)[number]["value"];

export function thisWeekRange(reference = new Date()): DateRange {
  return {
    from: startOfDay(startOfWeek(reference)),
    to: endOfDay(reference)
  };
}

export function rangeForPreset(
  type: DateRangePreset,
  reference = new Date()
): DateRange {
  switch (type) {
    case "today":
      return { from: startOfDay(reference), to: endOfDay(reference) };
    case "yesterday": {
      const yesterday = subDays(reference, 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }
    case "thisWeek":
      return thisWeekRange(reference);
    case "last7Days":
      return {
        from: startOfDay(subDays(reference, 6)),
        to: endOfDay(reference)
      };
    case "last28Days":
      return {
        from: startOfDay(subDays(reference, 27)),
        to: endOfDay(reference)
      };
    case "thisMonth":
      return { from: startOfMonth(reference), to: endOfDay(reference) };
    case "lastMonth": {
      const lastMonth = subMonths(reference, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case "thisYear":
      return {
        from: startOfDay(startOfYear(reference)),
        to: endOfDay(reference)
      };
  }
}

export function dateInRange(date: Date, range: DateRange | undefined): boolean {
  if (!range?.from) return true;
  const time = date.getTime();
  const from = startOfDay(range.from).getTime();
  const to = range.to ? endOfDay(range.to).getTime() : endOfDay(range.from).getTime();
  return time >= from && time <= to;
}

function formatRangeLabel(range: DateRange | undefined) {
  if (!range?.from) return "Select date range";
  if (range.to) {
    return `${format(range.from, "dd MMM yyyy")} - ${format(range.to, "dd MMM yyyy")}`;
  }
  return format(range.from, "dd MMM yyyy");
}

export function DateRangePicker({
  value,
  onChange,
  preset,
  onPresetChange,
  className
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  preset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
  className?: string;
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(
    () => value?.from ?? new Date()
  );

  const applyPreset = (next: DateRangePreset) => {
    const range = rangeForPreset(next);
    onPresetChange(next);
    onChange(range);
    if (range.from) setCurrentMonth(range.from);
  };

  const label = formatRangeLabel(value);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          title={isMobile ? label : undefined}
          className={cn(
            buttonVariants({ variant: "outline", size: isMobile ? "icon" : "default" }),
            !isMobile && "justify-start text-left font-normal",
            !value?.from && "text-muted-foreground"
          )}>
          <CalendarIcon />
          {isMobile ? null : <span>{label}</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="flex flex-col lg:flex-row">
            <div className="p-2.5 lg:pe-0">
              <div className="hidden w-28 flex-col gap-1 lg:flex">
                {dateFilterPresets.map((item) => (
                  <Button
                    key={item.value}
                    type="button"
                    variant={preset === item.value ? "secondary" : "ghost"}
                    className="text-muted-foreground w-full justify-start rounded-md"
                    onClick={() => applyPreset(item.value)}>
                    {item.name}
                  </Button>
                ))}
              </div>
              <Select
                value={preset}
                onValueChange={(next) => {
                  if (next == null) return;
                  applyPreset(next as DateRangePreset);
                }}>
                <SelectTrigger
                  className="mb-2 flex w-full lg:hidden"
                  size="sm"
                  aria-label="Select date range preset">
                  <SelectValue placeholder="This Week" />
                </SelectTrigger>
                <SelectContent>
                  {dateFilterPresets.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Calendar
              className="border-s-0 py-0! ps-0! pe-0! lg:border-s lg:ps-4!"
              mode="range"
              month={currentMonth}
              selected={value}
              onSelect={(next) => {
                onChange(next);
                if (next?.from) setCurrentMonth(next.from);
              }}
              onMonthChange={setCurrentMonth}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
