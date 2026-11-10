"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { BookingChrome } from "@/components/booking/booking-chrome";
import { QuantityStepper } from "@/components/booking/quantity-stepper";
import { HeroDateTimeField } from "@/components/marketing/hero-date-time-field";
import { buttonVariants } from "@/components/ui/button";
import { useBookingStore } from "@/lib/booking/booking-store";
import { useBookingGuard } from "@/lib/booking/use-booking-guard";
import { cn } from "@/lib/utils";

export function TripDetailsView() {
  const router = useRouter();
  const allowed = useBookingGuard("estimate");

  const tripType = useBookingStore((s) => s.tripType);
  const itinerary = useBookingStore((s) => s.itinerary);
  const setItinerary = useBookingStore((s) => s.setItinerary);
  const scheduledPickupAt = useBookingStore((s) => s.scheduledPickupAt);
  const setScheduledPickupAt = useBookingStore((s) => s.setScheduledPickupAt);
  const scheduledReturnAt = useBookingStore((s) => s.scheduledReturnAt);
  const setScheduledReturnAt = useBookingStore((s) => s.setScheduledReturnAt);
  const hourlyHours = useBookingStore((s) => s.hourlyHours);
  const setHourlyHours = useBookingStore((s) => s.setHourlyHours);
  const passengers = useBookingStore((s) => s.passengers);
  const setPassengers = useBookingStore((s) => s.setPassengers);
  const smallLuggage = useBookingStore((s) => s.smallLuggage);
  const setSmallLuggage = useBookingStore((s) => s.setSmallLuggage);
  const largeLuggage = useBookingStore((s) => s.largeLuggage);
  const setLargeLuggage = useBookingStore((s) => s.setLargeLuggage);
  const selectedVehicleClass = useBookingStore((s) => s.selectedVehicleClass);
  const canContinue = useBookingStore((s) => s.canProceedFromDetails());

  if (!allowed) {
    return (
      <BookingChrome step="details" backHref="/book">
        <p className="text-muted-foreground text-sm">Loading trip details…</p>
      </BookingChrome>
    );
  }

  const vehicleClass = selectedVehicleClass();
  const maxPassengers = vehicleClass?.capacity.passengerCount ?? 8;
  const maxSmall = vehicleClass?.capacity.luggage.smallCount ?? 8;
  const maxLarge = vehicleClass?.capacity.luggage.largeCount ?? 4;

  return (
    <BookingChrome step="details" backHref="/book">
      <div className="pb-28">
        <div className="mb-8 space-y-2">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Trip details
          </p>
          <h1 className="font-heading text-4xl tracking-tight">When and who</h1>
          <p className="text-muted-foreground max-w-xl text-sm text-balance">
            Confirm schedule, passengers, and luggage for this trip.
          </p>
        </div>

        <div className="space-y-8">
          {tripType === "transfer" ? (
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Itinerary</h2>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setItinerary("oneWay")}
                  className={cn(
                    "border-border border px-4 py-3 text-sm font-medium transition-colors",
                    itinerary === "oneWay"
                      ? "bg-foreground text-background"
                      : "bg-background hover:bg-muted"
                  )}>
                  One-way
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItinerary("return");
                    if (!scheduledReturnAt) {
                      const next = new Date(scheduledPickupAt);
                      next.setHours(next.getHours() + 4);
                      setScheduledReturnAt(next);
                    }
                  }}
                  className={cn(
                    "border-border border px-4 py-3 text-sm font-medium transition-colors",
                    itinerary === "return"
                      ? "bg-foreground text-background"
                      : "bg-background hover:bg-muted"
                  )}>
                  Return
                </button>
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Schedule</h2>
            <div className="border-border space-y-4 border p-4">
              <HeroDateTimeField
                id="details-pickup"
                label="Pickup"
                value={scheduledPickupAt}
                onChange={setScheduledPickupAt}
                minDate={new Date()}
                variant="plain"
              />
              {tripType === "transfer" && itinerary === "return" && scheduledReturnAt ? (
                <HeroDateTimeField
                  id="details-return"
                  label="Return"
                  value={scheduledReturnAt}
                  onChange={setScheduledReturnAt}
                  minDate={scheduledPickupAt}
                  variant="plain"
                />
              ) : null}
              {tripType === "hourly" ? (
                <QuantityStepper
                  id="hourly-hours"
                  label="Hours"
                  value={hourlyHours}
                  min={1}
                  max={24}
                  onChange={setHourlyHours}
                />
              ) : null}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-medium">Passengers & luggage</h2>
            <div className="space-y-2">
              <QuantityStepper
                id="passengers"
                label="Passengers"
                value={passengers}
                min={1}
                max={maxPassengers}
                onChange={setPassengers}
              />
              <QuantityStepper
                id="small-luggage"
                label="Small luggage"
                value={smallLuggage}
                min={0}
                max={maxSmall}
                onChange={setSmallLuggage}
              />
              <QuantityStepper
                id="large-luggage"
                label="Large luggage"
                value={largeLuggage}
                min={0}
                max={maxLarge}
                onChange={setLargeLuggage}
              />
            </div>
            {vehicleClass ? (
              <p className="text-muted-foreground text-xs">
                {vehicleClass.displayName} capacity: {maxPassengers} passengers, {maxSmall} small /{" "}
                {maxLarge} large luggage.
              </p>
            ) : null}
          </section>
        </div>

        <div className="border-border bg-background fixed inset-x-0 bottom-0 border-t px-4 py-4">
          <div className="mx-auto flex max-w-3xl gap-3">
            <Link
              href="/book"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "flex-1")}>
              Back
            </Link>
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => router.push("/book/payment")}
              className={cn(
                buttonVariants({ size: "lg" }),
                "flex-1",
                !canContinue && "opacity-45"
              )}>
              Continue to payment
            </button>
          </div>
        </div>
      </div>
    </BookingChrome>
  );
}
