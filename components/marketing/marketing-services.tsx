"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const GAP_PX = 20;

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
    id: "corporate-transfers",
    title: "Corporate Transfers",
    description:
      "Corporate accounts for executive travel, client pickups, and simplified billing across your team.",
    image: "/services/service-corporate-transfers.jpg",
    href: "/booking?tripType=transfer"
  }
] as const;

type Service = (typeof SERVICES)[number];

function ServiceCard({ service }: { service: Service }) {
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [hideY, setHideY] = useState(160);

  useLayoutEffect(() => {
    const node = descriptionRef.current;
    if (!node) return;

    const update = () => {
      const marginTop = Number.parseFloat(getComputedStyle(node).marginTop) || 0;
      setHideY(node.offsetHeight + marginTop);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [service.description]);

  return (
    <Link
      href={service.href}
      className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2">
      <Image
        src={service.image}
        alt=""
        fill
        className="object-cover object-center transition-transform duration-[400ms] group-hover:scale-[1.07]"
        sizes="(min-width: 640px) 33vw, 85vw"
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/5 bg-gradient-to-t from-black/90 to-transparent"
      />

      <div
        className="absolute inset-x-0 bottom-0 z-[1] translate-y-[var(--service-hide-y)] px-4 pt-6 pb-4 pr-14 text-white transition-transform duration-[400ms] ease-out group-hover:translate-y-0 sm:px-5 sm:pb-5 sm:pr-16"
        style={{ ["--service-hide-y" as string]: `${hideY}px` }}>
        <h3 className="text-base leading-snug font-medium tracking-tight sm:text-lg">
          {service.title}
        </h3>
        <p
          ref={descriptionRef}
          className="mt-2 max-w-[80%] text-sm leading-relaxed text-white/85 opacity-0 transition-opacity duration-[400ms] group-hover:opacity-100">
          {service.description}
        </p>
      </div>

      <span
        aria-hidden
        className="absolute right-4 bottom-4 z-[2] grid size-9 place-items-center rounded-lg bg-white text-neutral-950 transition-colors duration-[400ms] group-hover:bg-white/90 sm:right-5 sm:bottom-5">
        <ChevronRight className="size-4" />
      </span>
    </Link>
  );
}

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
    <section
      id="services"
      className="bg-background flex h-[100svh] scroll-mt-16 flex-col justify-center px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-6xl flex-col">
        <header className="mb-12 max-w-xl shrink-0 space-y-3">
          <h2 className="font-heading text-3xl tracking-tight text-balance sm:text-4xl">
            Travel that fits the day.
          </h2>
          <p className="text-muted-foreground text-base text-balance sm:text-lg">
            Airport, city, or by the hour—your journey starts here.
          </p>
        </header>

        <ul
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SERVICES.map((service) => (
            <li
              key={service.id}
              data-service-card
              className="w-[min(85%,20rem)] shrink-0 snap-start sm:w-[calc((100%-2.5rem)/3)]">
              <ServiceCard service={service} />
            </li>
          ))}
        </ul>

        <div className="mt-4 flex h-8 shrink-0 items-center justify-center gap-1">
          {showControls ? (
            <>
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
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
