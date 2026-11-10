"use client";

import Link from "next/link";
import { useEffect } from "react";

import { AddonsList } from "@/components/booking/addons-list";
import { AddressSearchField } from "@/components/booking/address-search-field";
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
  };
};

export function FareEstimateView({ seed }: FareEstimateViewProps) {
  const bootstrap = useBookingStore((s) => s.bootstrap);
  const ready = useBookingStore((s) => s.ready);
  const bootError = useBookingStore((s) => s.bootError);
  const pickup = useBookingStore((s) => s.pickup);
  const dropoff = useBookingStore((s) => s.dropoff);
  const setPickup = useBookingStore((s) => s.setPickup);
  const setDropoff = useBookingStore((s) => s.setDropoff);
  const pricingNotice = useBookingStore((s) => s.pricingNotice);
  const quoteError = useBookingStore((s) => s.quoteError);
  const route = useBookingStore((s) => s.route);
  const isRouting = useBookingStore((s) => s.isRouting);
  const isQuoting = useBookingStore((s) => s.isQuoting);
  const quote = useBookingStore((s) => s.quote);
  const selectedVehicleClassId = useBookingStore((s) => s.selectedVehicleClassId);
  const selectVehicleClass = useBookingStore((s) => s.selectVehicleClass);
  const availableAddons = useBookingStore((s) => s.availableAddons);
  const selectedAddonIds = useBookingStore((s) => s.selectedAddonIds);
  const toggleAddon = useBookingStore((s) => s.toggleAddon);
  const bookableVehicleClasses = useBookingStore((s) => s.bookableVehicleClasses);

  useEffect(() => {
    void bootstrap(seed);
    // Seed once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const classes = bookableVehicleClasses();
  const canContinue = Boolean(quote) && !isRouting && !isQuoting;

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
      <div className="space-y-3">
        <h1 className="font-heading text-3xl tracking-tight">Fare estimate</h1>
        <p className="text-muted-foreground text-sm">Preparing booking…</p>
      </div>
    );
  }

  return (
    <div className="pb-28">
      <div className="mb-8 space-y-2">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Fare estimate
        </p>
        <h1 className="font-heading text-4xl tracking-tight">Book a trip</h1>
      </div>

      <div className="space-y-8">
        <RouteMap
          pickup={pickup?.coordinate ?? null}
          dropoff={dropoff?.coordinate ?? null}
          geometry={route?.geometry ?? null}
        />

        {pricingNotice ? (
          <p className="border-border bg-muted/40 border px-4 py-3 text-sm">{pricingNotice}</p>
        ) : null}
        {quoteError ? <p className="text-destructive text-sm">{quoteError}</p> : null}

        <section className="border-border space-y-4 border p-5">
          <AddressSearchField
            id="pickup"
            label="Pickup"
            placeholder="Pickup address"
            value={pickup}
            onSelect={setPickup}
          />
          <AddressSearchField
            id="dropoff"
            label="Drop-off"
            placeholder="Drop-off address"
            value={dropoff}
            onSelect={setDropoff}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">Vehicle class</h2>
          <VehicleClassList
            classes={classes}
            selectedId={selectedVehicleClassId}
            onSelect={selectVehicleClass}
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

        {quote ? (
          <QuoteBreakdown quote={quote} route={route} />
        ) : pickup && dropoff && (isRouting || isQuoting) ? (
          <p className="text-muted-foreground text-sm">Calculating route and fare…</p>
        ) : null}
      </div>

      <div className="border-border bg-background fixed inset-x-0 bottom-0 border-t px-4 py-4">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <p className="text-muted-foreground text-center text-xs">
            All amounts are estimates. Final fare is confirmed at booking.
          </p>
          <Link
            href={canContinue ? "/book/details" : "#"}
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
