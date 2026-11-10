"use client";

import { EstimateTripFields } from "@/components/booking/estimate-trip-fields";
import { SiteHeader } from "@/components/marketing/site-header";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "estimate", label: "Estimate" },
  { id: "details", label: "Details" },
  { id: "payment", label: "Payment" },
  { id: "summary", label: "Summary" }
] as const;

export type BookingStepId = (typeof STEPS)[number]["id"];

type BookingChromeProps = {
  step: BookingStepId;
  children: React.ReactNode;
  showTripStrip?: boolean;
  contentClassName?: string;
};

export function BookingChrome({
  step,
  children,
  showTripStrip = false,
  contentClassName
}: BookingChromeProps) {
  const activeIndex = STEPS.findIndex((row) => row.id === step);

  return (
    <div className="bg-background flex min-h-full flex-col">
      <SiteHeader
        showSignIn={false}
        center={showTripStrip ? <EstimateTripFields /> : undefined}
      />

      <div className="border-border border-b px-4 py-3 sm:px-6">
        <nav
          aria-label="Booking steps"
          className="text-muted-foreground mx-auto flex max-w-6xl gap-2 overflow-x-auto text-xs font-medium tracking-wide uppercase">
          {STEPS.map((row, index) => {
            const isActive = row.id === step;
            const isPast = index < activeIndex;
            return (
              <span
                key={row.id}
                className={cn(
                  "shrink-0",
                  isActive && "text-foreground",
                  isPast && "text-foreground/70"
                )}>
                {row.label}
                {index < STEPS.length - 1 ? (
                  <span className="text-muted-foreground/50 mx-2" aria-hidden>
                    /
                  </span>
                ) : null}
              </span>
            );
          })}
        </nav>
      </div>

      <main
        className={cn(
          "mx-auto w-full flex-1 px-4 py-8 sm:px-6",
          showTripStrip ? "max-w-6xl" : "max-w-3xl",
          contentClassName
        )}>
        {children}
      </main>
    </div>
  );
}
