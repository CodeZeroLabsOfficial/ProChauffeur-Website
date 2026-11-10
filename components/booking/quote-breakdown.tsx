"use client";

import { formatMoney } from "@/lib/booking/quote-api";
import type { QuoteResult } from "@/lib/models/quote";

type QuoteBreakdownProps = {
  quote: QuoteResult;
};

export function QuoteBreakdown({ quote }: QuoteBreakdownProps) {
  return (
    <div className="space-y-4">
      <ul className="space-y-2 text-sm">
        <li className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">GST</span>
          <span className="tabular-nums">{formatMoney(quote.taxAmount, quote.currencyCode)}</span>
        </li>
      </ul>
      <div className="border-border flex items-center justify-between border-t pt-3 text-base font-semibold">
        <span>Estimated total</span>
        <span className="tabular-nums">{formatMoney(quote.displayTotal, quote.currencyCode)}</span>
      </div>
    </div>
  );
}
