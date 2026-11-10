"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { AddressSearchField } from "@/components/booking/address-search-field";
import { HeroDateTimeField } from "@/components/marketing/hero-date-time-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useBookingStore } from "@/lib/booking/booking-store";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-auto border-0 bg-transparent px-0 py-1 text-sm font-medium text-white shadow-none placeholder:text-white/45 focus-visible:ring-0 dark:bg-transparent";

const pillClass =
  "relative z-10 inline-flex h-9 items-center justify-center gap-1 rounded-full px-4 text-sm font-medium transition-colors duration-300";

const addressFieldClass =
  "border-white/15 min-w-0 flex-[1.7] border-b px-3 py-2 sm:border-r sm:border-b-0";

const dateTimeFieldClass =
  "border-white/15 min-w-0 border-b px-3 py-2 sm:w-[10.75rem] sm:flex-none sm:shrink-0 sm:border-b-0";

function defaultReturnDate(pickup: Date) {
  const d = new Date(pickup);
  d.setHours(d.getHours() + 4);
  return d;
}

export function EstimateTripStrip() {
  const pickup = useBookingStore((s) => s.pickup);
  const dropoff = useBookingStore((s) => s.dropoff);
  const setPickup = useBookingStore((s) => s.setPickup);
  const setDropoff = useBookingStore((s) => s.setDropoff);
  const tripType = useBookingStore((s) => s.tripType);
  const setTripType = useBookingStore((s) => s.setTripType);
  const itinerary = useBookingStore((s) => s.itinerary);
  const setItinerary = useBookingStore((s) => s.setItinerary);
  const scheduledPickupAt = useBookingStore((s) => s.scheduledPickupAt);
  const setScheduledPickupAt = useBookingStore((s) => s.setScheduledPickupAt);
  const scheduledReturnAt = useBookingStore((s) => s.scheduledReturnAt);
  const setScheduledReturnAt = useBookingStore((s) => s.setScheduledReturnAt);
  const hourlyHours = useBookingStore((s) => s.hourlyHours);
  const setHourlyHours = useBookingStore((s) => s.setHourlyHours);
  const mapboxCountry = useBookingStore((s) => s.mapboxCountry);
  const mapboxProximity = useBookingStore((s) => s.mapboxProximity);

  const [itineraryOpen, setItineraryOpen] = useState(false);
  const [thumb, setThumb] = useState({ left: 0, width: 0, ready: false });
  const [hasMounted, setHasMounted] = useState(false);
  const groupRef = useRef<HTMLDivElement>(null);
  const transferRef = useRef<HTMLButtonElement>(null);
  const hourlyRef = useRef<HTMLButtonElement>(null);
  const openItineraryFromChevronRef = useRef(false);

  const isTransfer = tripType === "transfer";
  const isReturn = isTransfer && itinerary === "return";
  const transferLabel = itinerary === "return" ? "Return" : "One-way";

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useLayoutEffect(() => {
    const active = isTransfer ? transferRef.current : hourlyRef.current;
    const group = groupRef.current;
    if (!active || !group) return;

    const measure = () => {
      const activeRect = active.getBoundingClientRect();
      const groupRect = group.getBoundingClientRect();
      setThumb({
        left: activeRect.left - groupRect.left,
        width: activeRect.width,
        ready: true
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    observer.observe(active);
    return () => observer.disconnect();
  }, [isTransfer, transferLabel]);

  function selectTransferItinerary(next: "oneWay" | "return") {
    setTripType("transfer");
    setItinerary(next);
    if (next === "return") {
      setScheduledReturnAt(defaultReturnDate(scheduledPickupAt));
    }
    setItineraryOpen(false);
  }

  function handlePickupChange(next: Date) {
    setScheduledPickupAt(next);
    if (scheduledReturnAt && scheduledReturnAt.getTime() < next.getTime()) {
      setScheduledReturnAt(defaultReturnDate(next));
    }
  }

  if (!hasMounted) {
    return (
      <div className="border-b border-white/10 bg-neutral-950 px-4 py-4 text-white lg:px-6">
        <div className="mx-auto h-[7.5rem] w-full max-w-6xl" aria-hidden />
      </div>
    );
  }

  return (
    <div className="border-b border-white/10 bg-neutral-950 px-4 py-4 text-white lg:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4">
        <div
          ref={groupRef}
          role="group"
          aria-label="Trip type"
          className="relative inline-flex rounded-full border border-white/20 bg-black/40 p-1">
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-1 bottom-1 left-0 rounded-full bg-white",
              "transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
              thumb.ready ? "opacity-100" : "opacity-0"
            )}
            style={{
              width: thumb.width,
              transform: `translateX(${thumb.left}px)`
            }}
          />

          <Popover
            open={itineraryOpen}
            onOpenChange={(open) => {
              if (!open) {
                setItineraryOpen(false);
                openItineraryFromChevronRef.current = false;
                return;
              }
              if (openItineraryFromChevronRef.current) {
                setItineraryOpen(true);
                openItineraryFromChevronRef.current = false;
              }
            }}>
            <PopoverTrigger
              ref={transferRef}
              type="button"
              className={cn(
                pillClass,
                isTransfer ? "text-neutral-950" : "text-white/80 hover:text-white"
              )}
              aria-label={`${transferLabel}. Use the arrow to choose One-way or Return`}
              onClick={(event) => {
                const fromChevron = (event.target as HTMLElement).closest(
                  "[data-itinerary-chevron]"
                );
                if (fromChevron) {
                  openItineraryFromChevronRef.current = true;
                  return;
                }
                openItineraryFromChevronRef.current = false;
                setTripType("transfer");
                setItineraryOpen(false);
              }}>
              {transferLabel}
              <span data-itinerary-chevron className="inline-flex" aria-hidden>
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-300",
                    itineraryOpen && "rotate-180",
                    isTransfer ? "opacity-70" : "opacity-60"
                  )}
                />
              </span>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-44 p-1">
              <button
                type="button"
                className="hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm"
                onClick={() => selectTransferItinerary("oneWay")}>
                One-way
                {itinerary === "oneWay" ? <Check className="size-4" /> : null}
              </button>
              <button
                type="button"
                className="hover:bg-accent flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm"
                onClick={() => selectTransferItinerary("return")}>
                Return
                {itinerary === "return" ? <Check className="size-4" /> : null}
              </button>
            </PopoverContent>
          </Popover>

          <button
            ref={hourlyRef}
            type="button"
            className={cn(
              pillClass,
              !isTransfer ? "text-neutral-950" : "text-white/80 hover:text-white"
            )}
            onClick={() => {
              setTripType("hourly");
              setItineraryOpen(false);
            }}>
            Hourly
          </button>
        </div>

        <div className="w-full border border-white/20 bg-black/35 p-3 sm:p-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-0">
            <AddressSearchField
              id="estimate-pickup"
              label="Pickup"
              placeholder="Pickup address"
              variant="hero"
              value={pickup}
              onSelect={setPickup}
              country={mapboxCountry}
              proximity={mapboxProximity}
              className={addressFieldClass}
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
                className={addressFieldClass}
              />
            ) : (
              <div className={addressFieldClass}>
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
              className={cn(dateTimeFieldClass, isReturn && "sm:border-r")}
            />

            {isReturn ? (
              <HeroDateTimeField
                id="estimate-return-at"
                label="Return"
                value={scheduledReturnAt ?? defaultReturnDate(scheduledPickupAt)}
                onChange={setScheduledReturnAt}
                minDate={scheduledPickupAt}
                className={dateTimeFieldClass}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
