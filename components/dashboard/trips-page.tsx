"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";

import {
  DateRangePicker,
  thisWeekRange,
  type DateRangePreset
} from "@/components/dashboard/date-range-picker";
import { ListPageHeader } from "@/components/dashboard/list-page-header";
import { TripsDataTable } from "@/components/dashboard/trips-data-table";

export function TripsPage() {
  const [preset, setPreset] = useState<DateRangePreset>("thisWeek");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => thisWeekRange());

  return (
    <>
      <ListPageHeader
        title="My Trips"
        description="Current and past bookings."
        actions={
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            preset={preset}
            onPresetChange={setPreset}
          />
        }
      />
      <TripsDataTable dateRange={dateRange} />
    </>
  );
}
