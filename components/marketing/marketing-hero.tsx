import Image from "next/image";

import { HeroBookingStrip } from "@/components/marketing/hero-booking-strip";

export function MarketingHero() {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden bg-neutral-950 text-white">
      <Image
        src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2400&auto=format&fit=crop"
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/55 to-neutral-950/25" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-20">
        <div className="animate-hero-copy mb-10 w-full space-y-4 text-center">
          <p className="font-heading text-4xl tracking-tight text-balance sm:text-5xl md:text-6xl">
            Arrive rested. Leave the road to us.
          </p>
          <h1 className="mx-auto max-w-2xl text-lg text-white/85 text-balance sm:text-xl">
            Private luxury chauffeurs for airport, city, and hourly journeys.
          </h1>
        </div>
        <HeroBookingStrip />
      </div>
    </section>
  );
}
