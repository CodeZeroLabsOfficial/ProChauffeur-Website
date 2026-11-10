import Link from "next/link";

import { FareEstimateView } from "@/components/booking/fare-estimate-view";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BookPageProps = {
  searchParams: Promise<{
    pickup?: string;
    dropoff?: string;
    scheduledPickupAt?: string;
    scheduledReturnAt?: string;
    itinerary?: string;
    tripType?: string;
    hourlyHours?: string;
  }>;
};

export default async function BookPage({ searchParams }: BookPageProps) {
  const params = await searchParams;
  const hourlyHours = params.hourlyHours ? Number(params.hourlyHours) : undefined;

  return (
    <div className="bg-background flex min-h-full flex-col">
      <header className="border-border border-b px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="font-heading text-lg tracking-tight">
            Elite Chauffeurs
          </Link>
          <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
            Back
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <FareEstimateView
          seed={{
            pickupText: params.pickup,
            dropoffText: params.dropoff,
            scheduledPickupAt: params.scheduledPickupAt,
            scheduledReturnAt: params.scheduledReturnAt,
            itinerary: params.itinerary === "return" ? "return" : "oneWay",
            tripType: params.tripType === "hourly" ? "hourly" : "transfer",
            hourlyHours:
              typeof hourlyHours === "number" && Number.isFinite(hourlyHours)
                ? hourlyHours
                : undefined
          }}
        />
      </main>
    </div>
  );
}
