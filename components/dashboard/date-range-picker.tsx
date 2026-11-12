"use client";

import {
  endOfDay,
  endOfMonth,
  endOfYear,
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const dateFilterPresets = [
  { name: "All time", value: "allTime" },
  { name: "Today", value: "today" },
  { name: "Yesterday", value: "yesterday" },
  { name: "This Week", value: "thisWeek" },
  { name: "Last week", value: "last7Days" },
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
): DateRange | undefined {
  switch (type) {
    case "allTime":
      return undefined;
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
    case "thisMonth":
      return { from: startOfMonth(reference), to: endOfMonth(reference) };
    case "lastMonth": {
      const lastMonth = subMonths(reference, 1);
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
    }
    case "thisYear":
      return { from: startOfYear(reference), to: endOfYear(reference) };
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
  if (!range?.from) return "All time";
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
  return (
    <Select
      value={preset}
      onValueChange={(next) => {
        if (next == null) return;
        const typed = next as DateRangePreset;
        onPresetChange(typed);
        onChange(rangeForPreset(typed));
      }}>
      <SelectTrigger size="sm" className={cn("min-w-44", className)}>
        <CalendarIcon className="text-muted-foreground size-3.5" />
        <SelectValue placeholder={formatRangeLabel(value)} />
      </SelectTrigger>
      <SelectContent>
        {dateFilterPresets.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
