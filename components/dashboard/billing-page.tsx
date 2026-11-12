"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { BillingDataTable } from "@/components/dashboard/billing-data-table";
import {
  DateRangePicker,
  thisWeekRange,
  type DateRangePreset
} from "@/components/dashboard/date-range-picker";
import { ListPageHeader } from "@/components/dashboard/list-page-header";

export function BillingPage() {
  const [preset, setPreset] = useState<DateRangePreset>("thisWeek");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => thisWeekRange());

  return (
    <>
      <ListPageHeader
        title="My Billing"
        description="Invoices and receipts for your trips."
        actions={
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            preset={preset}
            onPresetChange={setPreset}
          />
        }
      />
      <BillingDataTable dateRange={dateRange} />
    </>
  );
}
