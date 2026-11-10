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

export function BookingStepsBar({
  step,
  className
}: {
  step: BookingStepId;
  className?: string;
}) {
  const activeIndex = STEPS.findIndex((row) => row.id === step);

  return (
    <nav
      aria-label="Booking steps"
      className={cn(
        "text-muted-foreground flex gap-2 overflow-x-auto text-xs font-medium tracking-wide uppercase",
        className
      )}>
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
  );
}

type BookingChromeProps = {
  step: BookingStepId;
  children: React.ReactNode;
  showTripStrip?: boolean;
  /** When true, the page renders `BookingStepsBar` itself instead of under the header. */
  embedStepsInContent?: boolean;
  contentClassName?: string;
};

export function BookingChrome({
  step,
  children,
  showTripStrip = false,
  embedStepsInContent = false,
  contentClassName
}: BookingChromeProps) {
  const contentWidth = showTripStrip || embedStepsInContent ? "max-w-6xl" : "max-w-3xl";

  return (
    <div className="bg-background flex min-h-full flex-col">
      <div className="bg-background sticky top-0 z-40">
        <SiteHeader
          showSignIn={false}
          center={showTripStrip ? <EstimateTripFields /> : undefined}
        />
      </div>

      {!embedStepsInContent ? (
        <div className="border-border border-b">
          <div className={cn("mx-auto px-4 py-1.5 sm:px-6", contentWidth)}>
            <BookingStepsBar step={step} />
          </div>
        </div>
      ) : null}

      <main
        className={cn(
          "mx-auto w-full flex-1 px-4 pb-8 sm:px-6",
          embedStepsInContent ? "pt-0" : "pt-3",
          contentWidth,
          contentClassName
        )}>
        {children}
      </main>
    </div>
  );
}
