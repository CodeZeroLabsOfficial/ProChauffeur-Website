"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { SiteHeader } from "@/components/marketing/site-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ConfirmedView() {
  const params = useSearchParams();
  const tripId = params.get("tripId");

  return (
    <div className="bg-background flex min-h-full flex-col">
      <SiteHeader showSignIn={false} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-4 py-16 sm:px-6">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Confirmed
        </p>
        <h1 className="font-heading text-4xl tracking-tight">Your trip is booked</h1>
        <p className="text-muted-foreground max-w-xl text-lg text-balance">
          Payment succeeded and your booking request is in. You will receive updates at the email
          used to sign in.
        </p>
        {tripId ? (
          <p className="text-muted-foreground text-sm">
            Reference: <span className="text-foreground font-medium">{tripId}</span>
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Link href="/" className={cn(buttonVariants({ size: "lg" }))}>
            Back to home
          </Link>
          <Link href="/booking" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Book another trip
          </Link>
        </div>
      </main>
    </div>
  );
}
