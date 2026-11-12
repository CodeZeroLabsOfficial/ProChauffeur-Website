"use client";

import { useEffect, useRef, useState } from "react";
import { Briefcase, ChevronLeft, ChevronRight, Users } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GAP_PX = 20;
const CYCLE_MS = 4500;

const FLEET = [
  {
    id: "s-class",
    make: "Mercedes-Benz",
    model: "S-Class",
    passengers: 3,
    luggageSmall: 2,
    luggageLarge: 2,
    image: "/fleet/fleet-s-class.jpg"
  },
  {
    id: "7-series",
    make: "BMW",
    model: "7 Series",
    passengers: 3,
    luggageSmall: 2,
    luggageLarge: 2,
    image: "/fleet/fleet-7-series.jpg"
  },
  {
    id: "gls",
    make: "Mercedes-Benz",
    model: "GLS",
    passengers: 6,
    luggageSmall: 4,
    luggageLarge: 4,
    image: "/fleet/fleet-gls.jpg"
  },
  {
    id: "range-rover-sport",
    make: "Range Rover",
    model: "Sport",
    passengers: 5,
    luggageSmall: 4,
    luggageLarge: 4,
    image: "/fleet/fleet-range-rover-sport.jpg"
  },
  {
    id: "audi-q7",
    make: "Audi",
    model: "Q7",
    passengers: 6,
    luggageSmall: 4,
    luggageLarge: 4,
    image: "/fleet/fleet-audi-q7.jpg"
  }
] as const;

export function MarketingFleet() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCarousel, setIsCarousel] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsCarousel(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !isCarousel) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

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
  }, [isCarousel]);

  function scrollByPage(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const firstCard = track.querySelector<HTMLElement>("[data-fleet-card]");
    const step = firstCard ? firstCard.offsetWidth + GAP_PX : track.clientWidth / 3;
    const maxScroll = track.scrollWidth - track.clientWidth;
    const next = track.scrollLeft + direction * step;

    if (direction === 1 && next >= maxScroll - 2) {
      track.scrollTo({ left: 0, behavior: "smooth" });
      return;
    }
    if (direction === -1 && next <= 2) {
      track.scrollTo({ left: maxScroll, behavior: "smooth" });
      return;
    }
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  useEffect(() => {
    if (!isCarousel || isPaused) return;

    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const firstCard = track.querySelector<HTMLElement>("[data-fleet-card]");
      const step = firstCard ? firstCard.offsetWidth + GAP_PX : track.clientWidth / 3;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft + step >= maxScroll - 2) {
        track.scrollTo({ left: 0, behavior: "smooth" });
        return;
      }
      track.scrollBy({ left: step, behavior: "smooth" });
    }, CYCLE_MS);

    return () => window.clearInterval(id);
  }, [isCarousel, isPaused]);

  const showControls = isCarousel && (canScrollPrev || canScrollNext);

  return (
    <section
      id="fleet"
      className="flex min-h-[100svh] scroll-mt-16 flex-col px-4 py-14 sm:px-6 sm:py-20 lg:h-[100svh]"
      style={{ backgroundColor: "#F2F2F2" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsPaused(false);
        }
      }}>
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
        <header className="mb-8 max-w-xl shrink-0 space-y-3 lg:mb-12">
          <h2 className="font-display text-4xl tracking-tight text-balance text-neutral-950 sm:text-5xl">
            Our Luxury Fleet
          </h2>
          <p className="text-base text-balance text-neutral-600 sm:text-lg">
            Sedans and SUVs sized for the day ahead.
          </p>
        </header>

        <ul
          ref={trackRef}
          className="flex min-h-0 flex-col gap-5 lg:flex-1 lg:snap-x lg:snap-mandatory lg:flex-row lg:overflow-x-auto lg:scroll-smooth lg:[-ms-overflow-style:none] lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden">
          {FLEET.map((vehicle) => (
            <li
              key={vehicle.id}
              data-fleet-card
              className="w-full lg:h-full lg:w-[calc((100%-2.5rem)/3)] lg:shrink-0 lg:snap-start">
              <article className="relative aspect-[5/6] overflow-hidden rounded-2xl bg-neutral-200 lg:aspect-auto lg:h-full">
                <Image
                  src={vehicle.image}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  className="object-cover object-[center_70%]"
                  sizes="(min-width: 1024px) 33vw, 90vw"
                />
                <div className="absolute inset-x-0 bottom-0 border-t border-white/20 bg-neutral-950/45 px-4 py-3 text-white backdrop-blur-md">
                  <p className="text-sm font-medium tracking-tight sm:text-base">
                    {vehicle.make} {vehicle.model}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/85 sm:text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-3.5" aria-hidden />
                      <span className="sr-only">Passengers</span>
                      {vehicle.passengers}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="size-3.5" aria-hidden />
                      <span className="sr-only">Small luggage</span>
                      {vehicle.luggageSmall}
                      <span className="hidden lg:inline"> small</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="size-3.5" aria-hidden />
                      <span className="sr-only">Large luggage</span>
                      {vehicle.luggageLarge}
                      <span className="hidden lg:inline"> large</span>
                    </span>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <div className="mt-4 hidden h-8 shrink-0 items-center justify-center gap-1 lg:flex">
          {showControls ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Previous vehicles"
                onClick={() => scrollByPage(-1)}
                className={cn(!canScrollPrev && "opacity-50")}>
                <ChevronLeft />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label="Next vehicles"
                onClick={() => scrollByPage(1)}
                className={cn(!canScrollNext && "opacity-50")}>
                <ChevronRight />
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
