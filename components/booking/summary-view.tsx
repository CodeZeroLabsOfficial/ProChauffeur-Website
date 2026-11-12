"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import { BookingChrome } from "@/components/booking/booking-chrome";
import { StripePaymentForm } from "@/components/booking/stripe-payment-form";
import { buttonVariants } from "@/components/ui/button";
import { isEmailAuthenticatedUser } from "@/lib/auth/auth-otp";
import { useBookingStore } from "@/lib/booking/booking-store";
import { buildTripPayloads } from "@/lib/booking/build-trip-payload";
import {
  createTripCardPayment,
  TripPaymentError
} from "@/lib/booking/create-trip-payment";
import { formatMoney } from "@/lib/booking/quote-api";
import { useBookingGuard } from "@/lib/booking/use-booking-guard";
import { firebaseAuth } from "@/lib/firebase/client";
import { getStripePublishableKey } from "@/lib/env";
import { cn } from "@/lib/utils";

export function SummaryView() {
  const router = useRouter();
  const allowed = useBookingGuard("details");
  const bootstrap = useBookingStore((s) => s.bootstrap);
  const ready = useBookingStore((s) => s.ready);

  const pickup = useBookingStore((s) => s.pickup);
  const dropoff = useBookingStore((s) => s.dropoff);
  const scheduledPickupAt = useBookingStore((s) => s.scheduledPickupAt);
  const scheduledReturnAt = useBookingStore((s) => s.scheduledReturnAt);
  const itinerary = useBookingStore((s) => s.itinerary);
  const tripType = useBookingStore((s) => s.tripType);
  const hourlyHours = useBookingStore((s) => s.hourlyHours);
  const passengers = useBookingStore((s) => s.passengers);
  const smallLuggage = useBookingStore((s) => s.smallLuggage);
  const largeLuggage = useBookingStore((s) => s.largeLuggage);
  const quote = useBookingStore((s) => s.quote);
  const selectedAddonIds = useBookingStore((s) => s.selectedAddonIds);
  const availableAddons = useBookingStore((s) => s.availableAddons);
  const selectedVehicleClass = useBookingStore((s) => s.selectedVehicleClass);

  const [emailAuthed, setEmailAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) void bootstrap();
  }, [ready, bootstrap]);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), (user) => {
      setEmailAuthed(isEmailAuthenticatedUser(user));
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authReady && !emailAuthed) {
      router.replace("/booking/payment");
    }
  }, [authReady, emailAuthed, router]);

  async function handleStartPayment() {
    const user = firebaseAuth().currentUser;
    const vehicleClass = selectedVehicleClass();
    if (!user || !isEmailAuthenticatedUser(user) || !pickup || !dropoff || !quote || !vehicleClass) {
      setError("Booking is incomplete. Return to the fare estimate.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const selectedAddons = availableAddons.filter((addon) =>
        selectedAddonIds.includes(addon.id)
      );
      const trips = buildTripPayloads({
        customerId: user.uid,
        customerEmail: user.email ?? null,
        customerDisplayName: user.displayName ?? user.email?.split("@")[0] ?? null,
        pickup,
        dropoff,
        scheduledPickupAt,
        scheduledReturnAt,
        itinerary,
        tripType,
        hourlyHours,
        passengers,
        smallLuggage,
        largeLuggage,
        vehicleClass,
        selectedAddons,
        quote
      });

      const payment = await createTripCardPayment({ trips });
      setTripId(payment.tripId);
      setClientSecret(payment.clientSecret);
    } catch (err) {
      setError(err instanceof TripPaymentError ? err.message : "Could not start payment.");
    } finally {
      setBusy(false);
    }
  }

  if (!allowed || !authReady || !emailAuthed) {
    return (
      <BookingChrome step="summary">
        <p className="text-muted-foreground text-sm">Preparing summary…</p>
      </BookingChrome>
    );
  }

  const vehicleClass = selectedVehicleClass();
  const stripeConfigured = Boolean(getStripePublishableKey());
  const returnTotalHint =
    tripType === "transfer" && itinerary === "return"
      ? "Return trip fare is recomputed at confirmation."
      : null;

  return (
    <BookingChrome step="summary">
      <div className="pb-28">
        <div className="mb-8 space-y-2">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Summary
          </p>
          <h1 className="font-heading text-4xl tracking-tight">Confirm your trip</h1>
          <p className="text-muted-foreground max-w-xl text-sm text-balance">
            Review the details below. Amounts are estimates until booking confirms.
          </p>
        </div>

        <div className="space-y-6">
          <section className="border-border space-y-3 border p-5 text-sm">
            <h2 className="text-base font-medium">Journey</h2>
            <p>
              <span className="text-muted-foreground">Pickup</span>
              <br />
              {pickup?.addressLine}
            </p>
            <p>
              <span className="text-muted-foreground">Drop-off</span>
              <br />
              {dropoff?.addressLine}
            </p>
            <p>
              <span className="text-muted-foreground">Pickup time</span>
              <br />
              {format(scheduledPickupAt, "EEE d MMM yyyy HH:mm")}
            </p>
            {scheduledReturnAt && itinerary === "return" ? (
              <p>
                <span className="text-muted-foreground">Return time</span>
                <br />
                {format(scheduledReturnAt, "EEE d MMM yyyy HH:mm")}
              </p>
            ) : null}
            <p>
              <span className="text-muted-foreground">Trip</span>
              <br />
              {tripType === "hourly"
                ? `Hourly · ${hourlyHours}h`
                : itinerary === "return"
                  ? "Transfer · Return"
                  : "Transfer · One-way"}
            </p>
          </section>

          <section className="border-border space-y-3 border p-5 text-sm">
            <h2 className="text-base font-medium">Party</h2>
            <p>
              {passengers} passenger{passengers === 1 ? "" : "s"} · {smallLuggage} small /{" "}
              {largeLuggage} large luggage
            </p>
            <p>{vehicleClass?.displayName ?? "Vehicle class"}</p>
            {selectedAddonIds.length > 0 ? (
              <p>
                Add-ons:{" "}
                {availableAddons
                  .filter((addon) => selectedAddonIds.includes(addon.id))
                  .map((addon) => addon.title)
                  .join(", ")}
              </p>
            ) : null}
          </section>

          {quote ? (
            <section className="border-border space-y-2 border p-5 text-sm">
              <h2 className="text-base font-medium">Fare</h2>
              <p className="font-heading text-2xl tracking-tight">
                {formatMoney(quote.displayTotal, quote.currencyCode)}
              </p>
              <p className="text-muted-foreground text-xs">
                Estimate only. Final fare is confirmed at booking.
                {returnTotalHint ? ` ${returnTotalHint}` : ""}
              </p>
            </section>
          ) : null}

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          {clientSecret ? (
            <section className="border-border space-y-4 border p-5">
              <h2 className="text-base font-medium">Card payment</h2>
              {stripeConfigured ? (
                <StripePaymentForm
                  clientSecret={clientSecret}
                  onPaid={() =>
                    router.push(
                      tripId
                        ? `/booking/confirmed?tripId=${encodeURIComponent(tripId)}`
                        : "/booking/confirmed"
                    )
                  }
                  onError={setError}
                />
              ) : (
                <p className="text-sm">
                  Payment intent created{tripId ? ` for trip ${tripId}` : ""}, but Stripe is not
                  configured in this environment. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to finish
                  checkout.
                </p>
              )}
            </section>
          ) : null}
        </div>

        {!clientSecret ? (
          <div className="border-border bg-background fixed inset-x-0 bottom-0 border-t px-4 py-4">
            <div className="mx-auto flex max-w-3xl gap-3">
              <Link
                href="/booking/payment"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "flex-1")}>
                Back
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleStartPayment()}
                className={cn(buttonVariants({ size: "lg" }), "flex-1")}>
                {busy ? "Starting…" : "Confirm and pay"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </BookingChrome>
  );
}
