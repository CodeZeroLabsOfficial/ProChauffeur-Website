"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const GAP_PX = 24;

const SERVICES = [
  {
    id: "airport-transfers",
    title: "Airport Transfers",
    description:
      "Flight-aware pickup, meet-and-greet when you land, and a clear path from terminal to destination.",
    image: "/services/service-airport-transfers.jpg",
    href: "/booking?tripType=transfer"
  },
  {
    id: "point-to-point",
    title: "Point-to-Point",
    description:
      "Door-to-door across town with a set pickup time and a fare you see before you ride.",
    image: "/services/service-point-to-point.jpg",
    href: "/booking?tripType=transfer"
  },
  {
    id: "hourly-charter",
    title: "Hourly Charter",
    description:
      "One chauffeur for the afternoon—meetings, stops, and the spaces in between.",
    image: "/services/service-hourly-charter.jpg",
    href: "/booking?tripType=hourly"
  },
  {
    id: "return-trips",
    title: "Return Trips",
    description:
      "Outbound and return in a single booking, so the way home is already sorted.",
    image: "/services/service-return-trips.jpg",
    href: "/booking?tripType=transfer&itinerary=return"
  }
] as const;

export function MarketingServices() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

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
  }, []);

  const scrollByPage = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const firstCard = track.querySelector<HTMLElement>("[data-service-card]");
    const step = firstCard ? firstCard.offsetWidth + GAP_PX : track.clientWidth / 2;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  const showControls = canScrollPrev || canScrollNext;

  return (
    <section id="services" className="bg-background scroll-mt-20 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 max-w-2xl space-y-3">
          <h2 className="font-heading text-3xl tracking-tight text-balance sm:text-4xl">
            Travel that fits the day.
          </h2>
          <p className="text-muted-foreground text-base text-balance sm:text-lg">
            Airport, city, or by the hour—start with a live fare estimate.
          </p>
        </header>

        <ul
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SERVICES.map((service) => (
            <li
              key={service.id}
              data-service-card
              className="w-[min(85%,22rem)] shrink-0 snap-start sm:w-[calc((100%-3rem)/2.5)]">
              <article className="flex h-full flex-col gap-4">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border-0">
                  <Image
                    src={service.image}
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="(min-width: 640px) 40vw, 85vw"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <h3 className="text-lg font-medium tracking-tight">{service.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed text-balance sm:text-base">
                    {service.description}
                  </p>
                  <Link
                    href={service.href}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "mt-auto h-11 w-fit rounded-full px-6"
                    )}>
                    Get estimate
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>

        {showControls ? (
          <div className="mt-6 flex justify-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Previous services"
              disabled={!canScrollPrev}
              onClick={() => scrollByPage(-1)}>
              <ChevronLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Next services"
              disabled={!canScrollNext}
              onClick={() => scrollByPage(1)}>
              <ChevronRight />
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
