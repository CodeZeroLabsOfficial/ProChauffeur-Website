"use client";

import Link from "next/link";
import { useEffect } from "react";

import { AddonsList } from "@/components/booking/addons-list";
import { BookingStepsBar } from "@/components/booking/booking-chrome";
import { QuantityStepper } from "@/components/booking/quantity-stepper";
import { QuoteBreakdown } from "@/components/booking/quote-breakdown";
import { RouteMap } from "@/components/booking/route-map";
import { VehicleClassList } from "@/components/booking/vehicle-class-list";
import { buttonVariants } from "@/components/ui/button";
import { useBookingStore } from "@/lib/booking/booking-store";
import { formatMoney } from "@/lib/booking/quote-api";
import { cn } from "@/lib/utils";

type FareEstimateViewProps = {
  seed?: {
    pickupText?: string;
    dropoffText?: string;
    scheduledPickupAt?: string;
    scheduledReturnAt?: string;
    itinerary?: "oneWay" | "return";
    tripType?: "transfer" | "hourly";
    hourlyHours?: number;
  };
};

export function FareEstimateView({ seed }: FareEstimateViewProps) {
  const bootstrap = useBookingStore((s) => s.bootstrap);
  const ready = useBookingStore((s) => s.ready);
  const bootError = useBookingStore((s) => s.bootError);
  const pickup = useBookingStore((s) => s.pickup);
  const dropoff = useBookingStore((s) => s.dropoff);
  const pricingNotice = useBookingStore((s) => s.pricingNotice);
  const quoteError = useBookingStore((s) => s.quoteError);
  const route = useBookingStore((s) => s.route);
  const quote = useBookingStore((s) => s.quote);
  const classQuotes = useBookingStore((s) => s.classQuotes);
  const selectedVehicleClassId = useBookingStore((s) => s.selectedVehicleClassId);
  const selectVehicleClass = useBookingStore((s) => s.selectVehicleClass);
  const availableAddons = useBookingStore((s) => s.availableAddons);
  const selectedAddonIds = useBookingStore((s) => s.selectedAddonIds);
  const toggleAddon = useBookingStore((s) => s.toggleAddon);
  const bookableVehicleClasses = useBookingStore((s) => s.bookableVehicleClasses);
  const selectedVehicleClass = useBookingStore((s) => s.selectedVehicleClass);
  const smallLuggage = useBookingStore((s) => s.smallLuggage);
  const largeLuggage = useBookingStore((s) => s.largeLuggage);
  const setSmallLuggage = useBookingStore((s) => s.setSmallLuggage);
  const setLargeLuggage = useBookingStore((s) => s.setLargeLuggage);
  const canProceedFromEstimate = useBookingStore((s) => s.canProceedFromEstimate);

  useEffect(() => {
    void bootstrap(seed);
    // Seed once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classes = bookableVehicleClasses();
  const selected = selectedVehicleClass();
  const canContinue = canProceedFromEstimate();
  const classQuoteTotals = Object.fromEntries(
    Object.entries(classQuotes).map(([id, row]) => [id, row.displayTotal])
  );
  const classQuoteCurrency =
    quote?.currencyCode ??
    Object.values(classQuotes)[0]?.currencyCode ??
    "AUD";

  if (bootError) {
    return (
      <div className="border-border space-y-3 border p-5">
        <h1 className="font-heading text-3xl tracking-tight">Fare estimate</h1>
        <p className="text-destructive text-sm">{bootError}</p>
        <p className="text-muted-foreground text-sm">
          Confirm `.env.local` values and that Anonymous Auth is enabled for this stamp.
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="space-y-3 pt-3">
        <BookingStepsBar step="estimate" className="border-border border-b py-1.5" />
        <h1 className="font-heading text-3xl tracking-tight">Fare estimate</h1>
        <p className="text-muted-foreground text-sm">Preparing booking…</p>
      </div>
    );
  }

  return (
    <div className="pb-28 lg:pb-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8">
        <div className="min-w-0">
          <div className="border-border bg-background sticky top-16 z-30 border-b py-1.5">
            <BookingStepsBar step="estimate" />
          </div>

          <div className="space-y-8 pt-3">
            {pricingNotice ? (
              <p className="border-border bg-muted/40 border px-4 py-3 text-sm">{pricingNotice}</p>
            ) : null}
            {quoteError ? <p className="text-destructive text-sm">{quoteError}</p> : null}

            <section className="space-y-3">
              <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
                Choose your experience
              </h2>
              <VehicleClassList
                classes={classes}
                selectedId={selectedVehicleClassId}
                onSelect={selectVehicleClass}
                quoteTotals={classQuoteTotals}
                currencyCode={quote?.currencyCode ?? classQuoteCurrency}
              />
            </section>

            {selected ? (
              <section id="vehicle-class-details" className="scroll-mt-28 space-y-3">
                <h2 className="text-lg font-medium">What’s included</h2>
                {selected.description ? (
                  <p className="text-muted-foreground text-sm">{selected.description}</p>
                ) : null}
                {selected.inclusions.length > 0 ? (
                  <ul className="space-y-2">
                    {selected.inclusions.map((row) => (
                      <li
                        key={row.id}
                        className="border-border flex justify-between gap-4 border-b py-2 text-sm">
                        <span>{row.label}</span>
                        <span className="text-muted-foreground">{row.value}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No inclusions listed for this class.
                  </p>
                )}
              </section>
            ) : null}

            <section className="space-y-3">
              <h2 className="text-lg font-medium">Luggage</h2>
              <QuantityStepper
                id="estimate-small-luggage"
                label="Small bags"
                value={smallLuggage}
                min={0}
                max={selected?.capacity.luggage.smallCount}
                onChange={setSmallLuggage}
              />
              <QuantityStepper
                id="estimate-large-luggage"
                label="Large bags"
                value={largeLuggage}
                min={0}
                max={selected?.capacity.luggage.largeCount}
                onChange={setLargeLuggage}
              />
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-medium">Add-ons</h2>
              <AddonsList
                addons={availableAddons}
                selectedIds={selectedAddonIds}
                currencyCode={quote?.currencyCode ?? "AUD"}
                onToggle={toggleAddon}
              />
            </section>
          </div>
        </div>

        <aside
          className={cn(
            "border-border bg-background space-y-4 border p-4",
            "lg:mt-10 lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto"
          )}>
          <RouteMap
            pickup={pickup?.coordinate ?? null}
            dropoff={dropoff?.coordinate ?? null}
            geometry={route?.geometry ?? null}
          />

          <div className="flex items-start justify-between gap-3">
            {selected ? (
              <p className="font-medium">{selected.displayName}</p>
            ) : (
              <p className="text-muted-foreground text-sm">Select a vehicle class</p>
            )}
            {quote ? (
              <p className="shrink-0 text-sm font-medium tabular-nums">
                {formatMoney(
                  Math.max(0, quote.displayTotal - quote.taxAmount),
                  quote.currencyCode
                )}
              </p>
            ) : null}
          </div>

          {quote ? (
            <QuoteBreakdown quote={quote} />
          ) : (
            <p className="text-muted-foreground text-sm">
              Enter pickup and drop-off to see an estimate.
            </p>
          )}

          <p className="text-muted-foreground text-xs">
            All amounts are estimates. Final fare is confirmed at booking.
          </p>

          <Link
            href={canContinue ? "/booking/details" : "#"}
            aria-disabled={!canContinue}
            className={cn(
              buttonVariants({ size: "lg" }),
              "hidden w-full justify-between lg:inline-flex",
              !canContinue && "pointer-events-none opacity-45"
            )}>
            <span>Book now</span>
            <span>{quote ? formatMoney(quote.displayTotal, quote.currencyCode) : "—"}</span>
          </Link>
        </aside>
      </div>

      <div className="border-border bg-background fixed inset-x-0 bottom-0 border-t px-4 py-4 lg:hidden">
        <div className="mx-auto flex max-w-6xl flex-col gap-2">
          <p className="text-muted-foreground text-center text-xs">
            All amounts are estimates. Final fare is confirmed at booking.
          </p>
          <Link
            href={canContinue ? "/booking/details" : "#"}
            aria-disabled={!canContinue}
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full justify-between",
              !canContinue && "pointer-events-none opacity-45"
            )}>
            <span>Book now</span>
            <span>{quote ? formatMoney(quote.displayTotal, quote.currencyCode) : "—"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
