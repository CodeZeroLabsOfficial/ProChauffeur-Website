"use client";

import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { AddressSearchField } from "@/components/booking/address-search-field";
import { HeroDateTimeField } from "@/components/marketing/hero-date-time-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBookingStore } from "@/lib/booking/booking-store";
import { cn } from "@/lib/utils";

const chipClass =
  "inline-flex h-9 max-w-full items-center gap-2 border border-white/20 bg-black/35 px-3.5 text-left text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-black/45";

function defaultReturnDate(pickup: Date) {
  const d = new Date(pickup);
  d.setHours(d.getHours() + 4);
  return d;
}

function shortPlace(addressLine: string | undefined, fallback: string) {
  const value = addressLine?.trim();
  if (!value) return fallback;
  const first = value.split(",")[0]?.trim() || value;
  return first.length > 44 ? `${first.slice(0, 43)}…` : first;
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
  const [routeOpen, setRouteOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);

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
    return (
      <div
        className={cn(
          "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2",
          className
        )}
        aria-hidden>
        <div className="border-white/15 h-9 w-full max-w-2xl justify-self-stretch border bg-black/25" />
        <div className="border-white/15 hidden h-9 w-40 border bg-black/25 sm:block" />
        <div />
      </div>
    );
  }

  const pickupLabel = shortPlace(pickup?.addressLine, "Pickup address");
  const dropoffLabel = shortPlace(dropoff?.addressLine, "Drop-off address");
  const scheduleLabel = format(scheduledPickupAt, "EEE d MMM HH:mm");
  const returnLabel =
    isReturn && scheduledReturnAt
      ? format(scheduledReturnAt, "EEE d MMM HH:mm")
      : null;

  return (
    <div
      className={cn(
        "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2",
        className
      )}>
      <Popover open={routeOpen} onOpenChange={setRouteOpen}>
        <PopoverTrigger
          type="button"
          className={cn(chipClass, "w-full min-w-0 max-w-2xl justify-self-stretch")}>
          <span className="truncate">{pickupLabel}</span>
          {isTransfer ? (
            <>
              <ArrowRight className="size-3.5 shrink-0 text-white/45" aria-hidden />
              <span className="truncate">{dropoffLabel}</span>
            </>
          ) : (
            <>
              <span className="text-white/35" aria-hidden>
                ·
              </span>
              <span className="shrink-0">{hourlyHours}h</span>
            </>
          )}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="dark w-[min(92vw,28rem)] border-white/10 bg-neutral-950 p-3 text-white ring-white/10">
          <div className="space-y-3">
            <AddressSearchField
              id="estimate-pickup"
              label="Pickup"
              placeholder="Pickup address"
              variant="hero"
              value={pickup}
              onSelect={setPickup}
              country={mapboxCountry}
              proximity={mapboxProximity}
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
              />
            ) : (
              <div>
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
                  className="mt-1 h-9 border-white/15 bg-transparent text-white"
                />
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <PopoverTrigger type="button" className={cn(chipClass, "shrink-0")}>
          <span className="whitespace-nowrap">{scheduleLabel}</span>
          {returnLabel ? (
            <>
              <span className="text-white/35" aria-hidden>
                ·
              </span>
              <span className="whitespace-nowrap">{returnLabel}</span>
            </>
          ) : null}
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className="dark w-[min(92vw,22rem)] border-white/10 bg-neutral-950 p-3 text-white ring-white/10">
          <div className="space-y-3">
            <HeroDateTimeField
              id="estimate-pickup-at"
              label="Pickup"
              value={scheduledPickupAt}
              onChange={handlePickupChange}
            />
            {isReturn ? (
              <HeroDateTimeField
                id="estimate-return-at"
                label="Return"
                value={scheduledReturnAt ?? defaultReturnDate(scheduledPickupAt)}
                onChange={setScheduledReturnAt}
                minDate={scheduledPickupAt}
              />
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      <div aria-hidden className="min-w-0" />
    </div>
  );
}
