"use client";

import { formatMoney } from "@/lib/booking/quote-api";
import type { QuoteResult } from "@/lib/models/quote";
import { formatDistanceKm, formatDurationMinutes, type RouteEstimate } from "@/lib/mapbox/directions";

type QuoteBreakdownProps = {
  quote: QuoteResult;
  route: RouteEstimate | null;
};

export function QuoteBreakdown({ quote, route }: QuoteBreakdownProps) {
  const visibleLines = quote.breakdown.filter((line) => !line.isInternal);

  return (
    <div className="border-border space-y-4 border p-5">
      {route ? (
        <p className="text-muted-foreground text-sm">
          {formatDistanceKm(route.distanceMeters)} · {formatDurationMinutes(route.durationSeconds)}
        </p>
      ) : null}
      <ul className="space-y-2 text-sm">
        {visibleLines.map((line) => (
          <li key={line.id} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground">{line.label}</span>
            <span>{formatMoney(line.amount, quote.currencyCode)}</span>
          </li>
        ))}
      </ul>
      <div className="border-border flex items-center justify-between border-t pt-3 text-base font-semibold">
        <span>Estimated total</span>
        <span>{formatMoney(quote.displayTotal, quote.currencyCode)}</span>
      </div>
    </div>
  );
}
