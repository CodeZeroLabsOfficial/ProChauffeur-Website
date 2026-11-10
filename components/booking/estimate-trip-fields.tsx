"use client";

import { format } from "date-fns";
import { ArrowRight, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

import { AddressSearchField } from "@/components/booking/address-search-field";
import { HeroDateTimeField } from "@/components/marketing/hero-date-time-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBookingStore } from "@/lib/booking/booking-store";
import { cn } from "@/lib/utils";

const pillClass =
  "inline-flex h-9 max-w-full items-center gap-2 rounded-full border border-white/15 bg-white px-3.5 text-left text-[13px] font-medium text-neutral-700 shadow-none transition-colors hover:bg-white/95";

function defaultReturnDate(pickup: Date) {
  const d = new Date(pickup);
  d.setHours(d.getHours() + 4);
  return d;
}

function shortPlace(addressLine: string | undefined, fallback: string) {
  const value = addressLine?.trim();
  if (!value) return fallback;
  const first = value.split(",")[0]?.trim() || value;
  return first.length > 28 ? `${first.slice(0, 27)}…` : first;
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
      <div className={cn("flex min-w-0 flex-1 justify-center gap-2", className)} aria-hidden>
        <div className="bg-white/10 h-9 w-56 rounded-full sm:w-72" />
        <div className="bg-white/10 hidden h-9 w-52 rounded-full sm:block" />
      </div>
    );
  }

  const pickupLabel = shortPlace(pickup?.addressLine, "Pickup");
  const dropoffLabel = shortPlace(dropoff?.addressLine, "Drop-off");
  const scheduleLabel = format(scheduledPickupAt, "EEE, MMMM d");
  const timeLabel = format(scheduledPickupAt, "HH:mm");
  const returnTimeLabel =
    isReturn && scheduledReturnAt ? format(scheduledReturnAt, "HH:mm") : null;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto",
        className
      )}>
      <Popover open={routeOpen} onOpenChange={setRouteOpen}>
        <PopoverTrigger
          type="button"
          className={cn(pillClass, "min-w-0 max-w-[min(100%,28rem)]")}>
          <span className="truncate text-neutral-900">{pickupLabel}</span>
          {isTransfer ? (
            <>
              <ArrowRight className="size-3.5 shrink-0 text-neutral-400" aria-hidden />
              <span className="truncate text-neutral-900">{dropoffLabel}</span>
            </>
          ) : (
            <>
              <span className="text-neutral-300" aria-hidden>
                ·
              </span>
              <span className="shrink-0 text-neutral-900">{hourlyHours}h</span>
            </>
          )}
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className="dark w-[min(92vw,22rem)] border-white/10 bg-neutral-950 p-3 text-white ring-white/10">
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
        <PopoverTrigger type="button" className={cn(pillClass, "shrink-0")}>
          <span className="whitespace-nowrap text-neutral-900">{scheduleLabel}</span>
          <Clock3 className="size-3.5 shrink-0 text-neutral-400" aria-hidden />
          <span className="whitespace-nowrap text-neutral-900">{timeLabel}</span>
          {returnTimeLabel ? (
            <>
              <span className="text-neutral-300" aria-hidden>
                ·
              </span>
              <span className="whitespace-nowrap text-neutral-900">{returnTimeLabel}</span>
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
    </div>
  );
}
