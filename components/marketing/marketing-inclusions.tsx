"use client";

import { useEffect, useState } from "react";
import { BatteryCharging, Droplets, Luggage, Music2 } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

const CYCLE_MS = 5500;

const INCLUSIONS = [
  {
    id: "preferences",
    title: "Set your preferences",
    description: "Adjust the music and temperature to your preferences.",
    icon: Music2,
    image: "/inclusions/inclusion-preferences.jpg"
  },
  {
    id: "recharge",
    title: "Recharge your devices",
    description: "Stay connected on the go with universal chargers for iOS and Android.",
    icon: BatteryCharging,
    image: "/inclusions/inclusion-recharge.jpg"
  },
  {
    id: "luggage",
    title: "Luggage assistance",
    description: "Doors opened and luggage handled from curb to cabin, start to finish.",
    icon: Luggage,
    image: "/inclusions/inclusion-luggage.jpg"
  },
  {
    id: "water",
    title: "Complimentary water",
    description: "Complimentary still water available on board for your refreshment.",
    icon: Droplets,
    image: "/inclusions/inclusion-water.jpg"
  }
] as const;

export function MarketingInclusions() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % INCLUSIONS.length);
      setProgressKey((key) => key + 1);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [progressKey]);

  function select(index: number) {
    setActiveIndex(index);
    setProgressKey((key) => key + 1);
  }

  return (
    <section className="flex h-[100svh] scroll-mt-16 flex-col justify-center bg-neutral-950 px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex max-h-full w-full max-w-6xl flex-col">
        <header className="mx-auto mb-12 max-w-xl shrink-0 space-y-1.5 text-center">
          <h2 className="font-heading text-2xl leading-tight tracking-tight text-balance sm:text-3xl">
            Included in every ride.
          </h2>
          <p className="text-sm text-white/70 text-balance sm:text-base">
            The small details that make the journey feel considered.
          </p>
        </header>

        <div className="grid min-h-0 gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-8">
          <div className="grid h-full min-h-0 grid-rows-4 divide-y divide-white/10">
            {INCLUSIONS.map((item, index) => {
              const Icon = item.icon;
              const isActive = index === activeIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => select(index)}
                  className="relative flex min-h-0 w-full cursor-pointer flex-col justify-center gap-1.5 px-3 py-3.5 text-left transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 sm:gap-2 sm:px-4 sm:py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "shrink-0 transition-colors duration-300 [&>svg]:size-4",
                        isActive ? "text-white" : "text-white/55"
                      )}>
                      <Icon aria-hidden />
                    </span>
                    <h3
                      className={cn(
                        "text-base font-medium transition-colors duration-300 sm:text-lg",
                        isActive ? "text-white" : "text-white/55"
                      )}>
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-snug text-white/60">
                    {item.description}
                  </p>
                  {isActive ? (
                    <span
                      key={progressKey}
                      aria-hidden
                      className="absolute bottom-0 left-0 h-0.5 animate-inclusion-progress bg-white"
                      style={{ animationDuration: `${CYCLE_MS}ms` }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>

          <figure className="relative hidden min-h-0 overflow-hidden rounded-lg lg:block lg:h-full">
            {INCLUSIONS.map((item, index) => (
              <Image
                key={item.id}
                src={item.image}
                alt=""
                fill
                className={cn(
                  "object-cover object-center transition-opacity duration-500",
                  index === activeIndex ? "opacity-100" : "opacity-0"
                )}
                sizes="40vw"
              />
            ))}
          </figure>
        </div>
      </div>
    </section>
  );
}
