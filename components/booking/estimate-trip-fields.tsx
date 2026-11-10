"use client";

import { useEffect, useState } from "react";

import { AddressSearchField } from "@/components/booking/address-search-field";
import { HeroDateTimeField } from "@/components/marketing/hero-date-time-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBookingStore } from "@/lib/booking/booking-store";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-auto border-0 bg-transparent px-0 py-0.5 text-sm font-medium text-white shadow-none placeholder:text-white/45 focus-visible:ring-0 dark:bg-transparent";

const cellClass =
  "border-white/15 min-w-0 flex-1 px-3 py-1 sm:border-r";

function defaultReturnDate(pickup: Date) {
  const d = new Date(pickup);
  d.setHours(d.getHours() + 4);
  return d;
}

export function EstimateTripFields({ className }: { className?: string }) {
  const pickup = useBookingStore((s) => s.pickup);
  const dropoff = useBookingStore((s) => s.dropoff);
  const setPickup = useBookingStore((s) => s.setPickup);
  const setDropoff = useBookingStore((s) => s.setDropoff);
  const tripType = useBookingStore((s) => s.tripType);
  const itinerary = useBookingStore((s) => s.itinerary);
  const scheduledPickupAt = useBookingStore((s) => s.scheduledPickupAt);
  const setScheduledPickupAt = useBookingStore((s) => s.setScheduledPickupAt);
  const scheduledReturnAt = useBookingStore((s) => s.scheduledReturnAt);
  const setScheduledReturnAt = useBookingStore((s) => s.setScheduledReturnAt);
  const hourlyHours = useBookingStore((s) => s.hourlyHours);
  const setHourlyHours = useBookingStore((s) => s.setHourlyHours);
  const mapboxCountry = useBookingStore((s) => s.mapboxCountry);
  const mapboxProximity = useBookingStore((s) => s.mapboxProximity);
  const [hasMounted, setHasMounted] = useState(false);

  const isTransfer = tripType === "transfer";
  const isReturn = isTransfer && itinerary === "return";

  useEffect(() => {
    setHasMounted(true);
  }, []);

  function handlePickupChange(next: Date) {
    setScheduledPickupAt(next);
    if (scheduledReturnAt && scheduledReturnAt.getTime() < next.getTime()) {
      setScheduledReturnAt(defaultReturnDate(next));
    }
  }

  if (!hasMounted) {
    return <div className={cn("h-12 min-w-0 flex-1", className)} aria-hidden />;
  }

  return (
    <div
      className={cn(
        "border-white/20 bg-black/35 flex min-w-0 flex-1 overflow-x-auto backdrop-blur-md",
        className
      )}>
      <AddressSearchField
        id="estimate-pickup"
        label="Pickup"
        placeholder="Pickup address"
        variant="hero"
        value={pickup}
        onSelect={setPickup}
        country={mapboxCountry}
        proximity={mapboxProximity}
        className={cellClass}
      />

      {isTransfer ? (
        <AddressSearchField
          id="estimate-dropoff"
          label="Drop-off"
          placeholder="Drop-off address"
          variant="hero"
          value={dropoff}
          onSelect={setDropoff}
          country={mapboxCountry}
          proximity={pickup?.coordinate ?? mapboxProximity}
          className={cellClass}
        />
      ) : (
        <div className={cellClass}>
          <Label htmlFor="estimate-hours" className="text-xs font-medium text-white/70">
            Hours
          </Label>
          <Input
            id="estimate-hours"
            type="number"
            min={1}
            max={24}
            value={hourlyHours}
            onChange={(e) => setHourlyHours(Number(e.target.value) || 1)}
            className={fieldClass}
          />
        </div>
      )}

      <HeroDateTimeField
        id="estimate-pickup-at"
        label="Pickup"
        value={scheduledPickupAt}
        onChange={handlePickupChange}
        className={cn(
          cellClass,
          "sm:w-[10.5rem] sm:flex-none",
          !isReturn && "sm:border-r-0"
        )}
      />

      {isReturn ? (
        <HeroDateTimeField
          id="estimate-return-at"
          label="Return"
          value={scheduledReturnAt ?? defaultReturnDate(scheduledPickupAt)}
          onChange={setScheduledReturnAt}
          minDate={scheduledPickupAt}
          className={cn(cellClass, "sm:w-[10.5rem] sm:flex-none sm:border-r-0")}
        />
      ) : null}
    </div>
  );
}
