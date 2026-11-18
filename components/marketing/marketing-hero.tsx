import Image from "next/image";

import { HeroBookingStrip } from "@/components/marketing/hero-booking-strip";

export function MarketingHero() {
  return (
    <section
      id="hero"
      className="relative isolate -mt-16 min-h-[100svh] overflow-hidden bg-neutral-950 text-white">
      <Image
        src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2400&auto=format&fit=crop"
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/55 to-neutral-950/25" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col items-center justify-center px-4 pt-24 pb-16 sm:px-6 sm:pt-28 sm:pb-20">
        <div className="animate-hero-copy mb-10 w-full space-y-4 text-center">
          <h1 className="font-display text-5xl tracking-tight text-balance sm:text-6xl md:text-7xl">
            Luxury Chauffeur Service in Australia
          </h1>
          <p className="w-full text-lg text-white/85 text-balance sm:text-xl">
            Enjoy a comfortable and seamless journey with professional chauffeurs, premium
            vehicles and personalised service tailored to your travel needs.
          </p>
        </div>
        <HeroBookingStrip />
      </div>
    </section>
  );
}
