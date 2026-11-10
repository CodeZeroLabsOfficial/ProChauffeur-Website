"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, ChevronLeft, ChevronRight, Users } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/booking/quote-api";
import type { VehicleClass } from "@/lib/models/vehicle-class";
import { cn } from "@/lib/utils";

const GAP_PX = 12;

type VehicleClassListProps = {
  classes: VehicleClass[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  quoteTotals?: Record<string, number>;
  currencyCode?: string;
};

export function VehicleClassList({
  classes,
  selectedId,
  onSelect,
  quoteTotals = {},
  currencyCode = "AUD"
}: VehicleClassListProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const selected = classes.find((row) => row.id === selectedId) ?? null;

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      setCanScrollPrev(track.scrollLeft > 2);
      setCanScrollNext(track.scrollLeft < maxScroll - 2);
    };

    update();
    track.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [classes.length]);

  if (classes.length === 0) {
    return <p className="text-muted-foreground text-sm">No vehicle classes available yet.</p>;
  }

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const firstCard = track.querySelector<HTMLElement>("[data-vehicle-card]");
    const step = firstCard ? firstCard.offsetWidth + GAP_PX : track.clientWidth / 3;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const showControls = canScrollPrev || canScrollNext;

  return (
    <div className="space-y-3">
      <ul
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {classes.map((vehicleClass) => {
          const isSelected = vehicleClass.id === selectedId;
          const quoteTotal = quoteTotals[vehicleClass.id];
          return (
            <li
              key={vehicleClass.id}
              data-vehicle-card
              className="w-[min(85%,18rem)] shrink-0 snap-start sm:w-[calc((100%-0.75rem)/2)] lg:w-[calc((100%-1.5rem)/3)]">
              <button
                type="button"
                onClick={() => onSelect(vehicleClass.id)}
                aria-pressed={isSelected}
                className={cn(
                  "bg-background flex w-full flex-col overflow-hidden rounded-2xl border text-left transition-[border-color,box-shadow]",
                  isSelected
                    ? "border-foreground ring-foreground/15 ring-2"
                    : "border-border hover:border-foreground/40"
                )}>
                <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden">
                  {vehicleClass.imageUrl ? (
                    <Image
                      src={vehicleClass.imageUrl}
                      alt=""
                      fill
                      className="object-cover object-center"
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 40vw, 85vw"
                    />
                  ) : null}
                </div>
                <div className="space-y-2 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium leading-tight">{vehicleClass.displayName}</p>
                    {quoteTotal != null ? (
                      <p className="shrink-0 text-sm font-medium tabular-nums">
                        {formatMoney(quoteTotal, currencyCode)}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" aria-hidden />
                      {vehicleClass.capacity.passengerCount}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="size-3.5" aria-hidden />
                      {vehicleClass.capacity.luggage.smallCount} small
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="size-3.5" aria-hidden />
                      {vehicleClass.capacity.luggage.largeCount} large
                    </span>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center gap-4">
        {selected ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
            onClick={() => {
              document
                .getElementById("vehicle-class-details")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}>
            ↓ Explore {selected.displayName} details
          </button>
        ) : null}
        {showControls ? (
          <div className="ml-auto flex shrink-0 gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Previous vehicle classes"
              disabled={!canScrollPrev}
              onClick={() => scrollByPage(-1)}>
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Next vehicle classes"
              disabled={!canScrollNext}
              onClick={() => scrollByPage(1)}>
              <ChevronRight />
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
