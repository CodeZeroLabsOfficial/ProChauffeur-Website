"use client";

import { Check, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { AddressSearchField } from "@/components/booking/address-search-field";
import { HeroDateTimeField } from "@/components/marketing/hero-date-time-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  fetchBranches,
  fetchOperatingMapboxContext,
  type OperatingMapboxContext
} from "@/lib/booking/catalog";
import type { SelectedPlace } from "@/lib/booking/booking-store";
import { ensureAnonymousAuth } from "@/lib/firebase/ensure-anonymous";
import type { TripType } from "@/lib/models/enums";
import { cn } from "@/lib/utils";

type Itinerary = "oneWay" | "return";

function defaultPickupDate() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  return d;
}

function defaultReturnDate(pickup: Date) {
  const d = new Date(pickup);
  d.setHours(d.getHours() + 4);
  return d;
}

const fieldClass =
  "h-auto border-0 bg-transparent px-0 py-1 text-sm font-medium text-white shadow-none placeholder:text-white/45 focus-visible:ring-0 dark:bg-transparent";

const pillClass =
  "relative z-10 inline-flex h-9 items-center justify-center gap-1 rounded-full px-4 text-sm font-medium transition-colors duration-300";

export function HeroBookingStrip() {
  const router = useRouter();
  const [tripType, setTripType] = useState<TripType>("transfer");
  const [itinerary, setItinerary] = useState<Itinerary>("oneWay");
  const [itineraryOpen, setItineraryOpen] = useState(false);
  const [pickup, setPickup] = useState<SelectedPlace | null>(null);
  const [dropoff, setDropoff] = useState<SelectedPlace | null>(null);
  const [pickupText, setPickupText] = useState("");
  const [dropoffText, setDropoffText] = useState("");
  const [hourlyHours, setHourlyHours] = useState("3");
  const [scheduledPickupAt, setScheduledPickupAt] = useState(defaultPickupDate);
  const [scheduledReturnAt, setScheduledReturnAt] = useState(() =>
    defaultReturnDate(defaultPickupDate())
  );
  const [thumb, setThumb] = useState({ left: 0, width: 0, ready: false });
  const [mapbox, setMapbox] = useState<OperatingMapboxContext>({
    country: null,
    proximity: null
  });

  const groupRef = useRef<HTMLDivElement>(null);
  const transferRef = useRef<HTMLButtonElement>(null);
  const hourlyRef = useRef<HTMLButtonElement>(null);
  const openItineraryFromChevronRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await ensureAnonymousAuth();
        const branches = await fetchBranches();
        const context = await fetchOperatingMapboxContext(branches);
        if (!cancelled) setMapbox(context);
      } catch {
        if (!cancelled) setMapbox({ country: null, proximity: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isTransfer = tripType === "transfer";
  const isReturn = isTransfer && itinerary === "return";
  const transferLabel = itinerary === "return" ? "Return" : "One-way";

  useLayoutEffect(() => {
    const active = isTransfer ? transferRef.current : hourlyRef.current;
    const group = groupRef.current;
    if (!active || !group) return;

    const measure = () => {
      const groupRect = group.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
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

  function selectTransferItinerary(next: Itinerary) {
    setTripType("transfer");
    setItinerary(next);
    if (next === "return") {
      setScheduledReturnAt(defaultReturnDate(scheduledPickupAt));
    }
    setItineraryOpen(false);
  }

  function handlePickupChange(next: Date) {
    setScheduledPickupAt(next);
    if (scheduledReturnAt.getTime() < next.getTime()) {
      setScheduledReturnAt(defaultReturnDate(next));
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    params.set("tripType", tripType);
    if (isTransfer) params.set("itinerary", itinerary);
    const pickupValue = (pickup?.addressLine || pickupText).trim();
    const dropoffValue = (dropoff?.addressLine || dropoffText).trim();
    if (pickupValue) params.set("pickup", pickupValue);
    if (isTransfer && dropoffValue) params.set("dropoff", dropoffValue);
    if (!isTransfer) params.set("hourlyHours", hourlyHours);
    params.set("scheduledPickupAt", scheduledPickupAt.toISOString());
    if (isReturn) {
      params.set("scheduledReturnAt", scheduledReturnAt.toISOString());
    }
    router.push(`/book?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-hero-strip flex w-full flex-col items-center gap-4">
      <div
        ref={groupRef}
        role="group"
        aria-label="Trip type"
        className="relative inline-flex rounded-full border border-white/20 bg-black/40 p-1 backdrop-blur-md">
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute top-1 left-0 bottom-1 rounded-full bg-white",
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

      <div className="w-full border border-white/20 bg-black/35 p-3 backdrop-blur-md sm:p-2">
        <div
          key={`${tripType}-${itinerary}`}
          className="animate-hero-fields flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-0">
          <AddressSearchField
            id="hero-pickup"
            label="Pickup"
            placeholder="Pickup address"
            variant="hero"
            value={pickup}
            onSelect={setPickup}
            onQueryChange={setPickupText}
            country={mapbox.country}
            proximity={mapbox.proximity}
            className="border-white/15 min-w-0 flex-1 border-b px-3 py-2 sm:border-r sm:border-b-0"
          />

          {isTransfer ? (
            <AddressSearchField
              id="hero-dropoff"
              label="Drop-off"
              placeholder="Drop-off address"
              variant="hero"
              value={dropoff}
              onSelect={setDropoff}
              onQueryChange={setDropoffText}
              country={mapbox.country}
              proximity={pickup?.coordinate ?? mapbox.proximity}
              className="border-white/15 min-w-0 flex-1 border-b px-3 py-2 sm:border-r sm:border-b-0"
            />
          ) : (
            <div className="border-white/15 min-w-0 flex-1 border-b px-3 py-2 sm:border-r sm:border-b-0">
              <Label htmlFor="hero-hours" className="text-xs font-medium text-white/70">
                Hours
              </Label>
              <Input
                id="hero-hours"
                name="hourlyHours"
                type="number"
                min={1}
                max={24}
                value={hourlyHours}
                onChange={(e) => setHourlyHours(e.target.value)}
                className={fieldClass}
              />
            </div>
          )}

          <HeroDateTimeField
            id="hero-pickup-at"
            label="Pickup"
            value={scheduledPickupAt}
            onChange={handlePickupChange}
            className={
              isReturn
                ? "border-white/15 min-w-0 flex-1 border-b px-3 py-2 sm:border-r sm:border-b-0"
                : "min-w-0 flex-1 px-3 py-2"
            }
          />

          {isReturn ? (
            <HeroDateTimeField
              id="hero-return-at"
              label="Return"
              value={scheduledReturnAt}
              onChange={setScheduledReturnAt}
              minDate={scheduledPickupAt}
              className="min-w-0 flex-1 px-3 py-2"
            />
          ) : null}

          <div className="flex items-center px-1 sm:self-center sm:pl-2">
            <Button
              type="submit"
              size="lg"
              className="h-11 w-full bg-white px-6 text-neutral-950 hover:bg-white/90 sm:w-auto">
              Get estimate
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
