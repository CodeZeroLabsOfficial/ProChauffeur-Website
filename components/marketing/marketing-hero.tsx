import Image from "next/image";

import { HeroBookingStrip } from "@/components/marketing/hero-booking-strip";
import { SiteHeader } from "@/components/marketing/site-header";

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

      <SiteHeader />

      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32">
        <div className="animate-hero-copy mb-10 max-w-2xl space-y-4">
          <p className="font-heading text-4xl tracking-tight text-balance sm:text-5xl md:text-6xl">
            ProChauffeur
          </p>
          <h1 className="max-w-xl text-lg text-white/85 text-balance sm:text-xl">
            Professional chauffeur travel, quoted in minutes.
          </h1>
        </div>
        <HeroBookingStrip />
      </div>
    </section>
  );
}
