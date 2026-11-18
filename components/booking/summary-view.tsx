"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef, useState } from "react";

import {
  BookingPaymentPanel,
  type PaymentSelection
} from "@/components/booking/booking-payment-panel";
import { BookingStepsBar } from "@/components/booking/booking-chrome";
import { QuoteBreakdown } from "@/components/booking/quote-breakdown";
import { RouteMap } from "@/components/booking/route-map";
import {
  confirmSavedCardPayment,
  type StripePaymentConfirmHandle
} from "@/components/booking/stripe-payment-form";
import { buttonVariants } from "@/components/ui/button";
import { isEmailAuthenticatedUser } from "@/lib/auth/auth-otp";
import { clearBookingSession } from "@/lib/booking/booking-session";
import {
  useBookingStore,
  type SelectedPlace
} from "@/lib/booking/booking-store";
import {
  allocateBookingTripIds,
  buildTripPayloads,
  type BookingTripIds
} from "@/lib/booking/build-trip-payload";
import {
  createTripCardPayment,
  TripPaymentError
} from "@/lib/booking/create-trip-payment";
import { formatMoney } from "@/lib/booking/quote-api";
import { useBookingGuard } from "@/lib/booking/use-booking-guard";
import { getStripePublishableKey } from "@/lib/env";
import { firebaseAuth } from "@/lib/firebase/client";
import { formatDistanceKm, formatDurationMinutes } from "@/lib/mapbox/directions";
import { cn } from "@/lib/utils";

function placeAttemptKey(place: SelectedPlace | null): string {
  if (!place) return "";
  return `${place.coordinate.latitude},${place.coordinate.longitude}|${place.addressLine}`;
}

export function SummaryView() {
  const router = useRouter();
  const allowed = useBookingGuard("summary");
  const bootstrap = useBookingStore((s) => s.bootstrap);
  const ready = useBookingStore((s) => s.ready);

  const pickup = useBookingStore((s) => s.pickup);
  const dropoff = useBookingStore((s) => s.dropoff);
  const scheduledPickupAt = useBookingStore((s) => s.scheduledPickupAt);
  const scheduledReturnAt = useBookingStore((s) => s.scheduledReturnAt);
  const itinerary = useBookingStore((s) => s.itinerary);
  const serviceType = useBookingStore((s) => s.serviceType);
  const hourlyHours = useBookingStore((s) => s.hourlyHours);
  const passengers = useBookingStore((s) => s.passengers);
  const smallLuggage = useBookingStore((s) => s.smallLuggage);
  const largeLuggage = useBookingStore((s) => s.largeLuggage);
  const quote = useBookingStore((s) => s.quote);
  const route = useBookingStore((s) => s.route);
  const isRouting = useBookingStore((s) => s.isRouting);
  const isQuoting = useBookingStore((s) => s.isQuoting);
  const selectedAddonIds = useBookingStore((s) => s.selectedAddonIds);
  const availableAddons = useBookingStore((s) => s.availableAddons);
  const selectedVehicleClass = useBookingStore((s) => s.selectedVehicleClass);
  const selectedVehicleClassId = useBookingStore((s) => s.selectedVehicleClassId);

  const [emailAuthed, setEmailAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);
  const [isPreparingCard, setIsPreparingCard] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [selection, setSelection] = useState<PaymentSelection>({ mode: "new" });
  const paymentFormRef = useRef<StripePaymentConfirmHandle | null>(null);
  const tripIdsRef = useRef<{ attemptKey: string; ids: BookingTripIds } | null>(null);
  const preparedForKeyRef = useRef<string | null>(null);
  const prepareInFlightRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) void bootstrap();
  }, [ready, bootstrap]);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), (user) => {
      setEmailAuthed(isEmailAuthenticatedUser(user));
      setUid(user && isEmailAuthenticatedUser(user) ? user.uid : null);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (authReady && !emailAuthed) {
      router.replace(`/login?redirect=${encodeURIComponent("/booking/summary")}`);
    }
  }, [authReady, emailAuthed, router]);

  const selectionKey =
    selection.mode === "saved" ? `saved:${selection.paymentMethodId}` : "new";
  const addonKey = [...selectedAddonIds].sort().join(",");
  const attemptKey = [
    uid ?? "",
    placeAttemptKey(pickup),
    placeAttemptKey(dropoff),
    scheduledPickupAt instanceof Date ? scheduledPickupAt.toISOString() : "",
    scheduledReturnAt instanceof Date ? scheduledReturnAt.toISOString() : "",
    itinerary,
    serviceType,
    String(hourlyHours),
    String(passengers),
    String(smallLuggage),
    String(largeLuggage),
    selectedVehicleClassId ?? "",
    addonKey
  ].join("|");
  const prepareKey = [
    attemptKey,
    quote ? `${quote.total}:${quote.currencyCode}` : "",
    saveCard ? "1" : "0",
    selectionKey
  ].join("|");

  useEffect(() => {
    preparedForKeyRef.current = null;
    prepareInFlightRef.current = null;
    setClientSecret(null);
    setTripId(null);
  }, [prepareKey]);

  useEffect(() => {
    if (!allowed || !authReady || !emailAuthed) return;
    if (selection.mode !== "new") return;
    if (isRouting || isQuoting) return;
    if (preparedForKeyRef.current === prepareKey) return;
    if (prepareInFlightRef.current === prepareKey) return;

    if (!getStripePublishableKey()) {
      setError(
        "Card checkout is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for this environment."
      );
      return;
    }

    const user = firebaseAuth().currentUser;
    const vehicleClass = selectedVehicleClass();
    if (!user || !isEmailAuthenticatedUser(user) || !pickup || !dropoff || !quote || !vehicleClass) {
      return;
    }

    const needsReturn =
      serviceType === "transfer" &&
      itinerary === "return" &&
      scheduledReturnAt instanceof Date &&
      !Number.isNaN(scheduledReturnAt.getTime());
    if (!tripIdsRef.current || tripIdsRef.current.attemptKey !== attemptKey) {
      tripIdsRef.current = {
        attemptKey,
        ids: allocateBookingTripIds(needsReturn)
      };
    }

    let cancelled = false;
    prepareInFlightRef.current = prepareKey;
    setIsPreparingCard(true);
    setError(null);

    const selectedAddons = availableAddons.filter((addon) => selectedAddonIds.includes(addon.id));
    const trips = buildTripPayloads({
      customerId: user.uid,
      customerEmail: user.email ?? null,
      customerDisplayName: user.displayName ?? user.email?.split("@")[0] ?? null,
      pickup,
      dropoff,
      scheduledPickupAt,
      scheduledReturnAt,
      itinerary,
      serviceType,
      hourlyHours,
      passengers,
      smallLuggage,
      largeLuggage,
      vehicleClass,
      selectedAddons,
      quote,
      tripIds: tripIdsRef.current.ids
    });

    void createTripCardPayment({ trips, saveCard })
      .then((payment) => {
        if (cancelled) return;
        preparedForKeyRef.current = prepareKey;
        setClientSecret(payment.clientSecret);
        setTripId(payment.tripId);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof TripPaymentError ? err.message : "Could not prepare card payment.");
      })
      .finally(() => {
        if (prepareInFlightRef.current === prepareKey) {
          prepareInFlightRef.current = null;
        }
        if (!cancelled) setIsPreparingCard(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    allowed,
    authReady,
    emailAuthed,
    selection.mode,
    prepareKey,
    attemptKey,
    isRouting,
    isQuoting,
    saveCard,
    pickup,
    dropoff,
    quote,
    scheduledPickupAt,
    scheduledReturnAt,
    itinerary,
    serviceType,
    hourlyHours,
    passengers,
    smallLuggage,
    largeLuggage,
    availableAddons,
    selectedAddonIds,
    selectedVehicleClass
  ]);

  function handleSaveCardChange(next: boolean) {
    setSaveCard(next);
  }

  function resolveTripIds(): BookingTripIds {
    const needsReturn =
      serviceType === "transfer" &&
      itinerary === "return" &&
      scheduledReturnAt instanceof Date &&
      !Number.isNaN(scheduledReturnAt.getTime());
    if (!tripIdsRef.current || tripIdsRef.current.attemptKey !== attemptKey) {
      tripIdsRef.current = {
        attemptKey,
        ids: allocateBookingTripIds(needsReturn)
      };
    }
    return tripIdsRef.current.ids;
  }

  async function handleBookNow() {
    const user = firebaseAuth().currentUser;
    const vehicleClass = selectedVehicleClass();
    if (!user || !isEmailAuthenticatedUser(user) || !pickup || !dropoff || !quote || !vehicleClass) {
      setError("Booking is incomplete. Return to the fare estimate.");
      return;
    }
    if (!getStripePublishableKey()) {
      setError("Card checkout is not configured for this environment.");
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
        serviceType,
        hourlyHours,
        passengers,
        smallLuggage,
        largeLuggage,
        vehicleClass,
        selectedAddons,
        quote,
        tripIds: resolveTripIds()
      });

      if (selection.mode === "saved") {
        const payment = await createTripCardPayment({
          trips,
          paymentMethodId: selection.paymentMethodId
        });
        setTripId(payment.tripId);
        const confirmed = await confirmSavedCardPayment({
          clientSecret: payment.clientSecret,
          paymentMethodId: selection.paymentMethodId
        });
        if (!confirmed.ok) {
          setError(confirmed.message);
          return;
        }
        clearBookingSession();
        router.push(`/booking/confirmed?tripId=${encodeURIComponent(payment.tripId)}`);
        return;
      }

      if (!clientSecret) {
        setError("Card form is still preparing. Try again in a moment.");
        return;
      }

      const confirmed = await paymentFormRef.current?.confirm();
      if (!confirmed) {
        if (!paymentFormRef.current) {
          setError("Enter your card details, then press Book now.");
        }
        return;
      }
      clearBookingSession();
      router.push(
        tripId
          ? `/booking/confirmed?tripId=${encodeURIComponent(tripId)}`
          : "/booking/confirmed"
      );
    } catch (err) {
      setError(err instanceof TripPaymentError ? err.message : "Could not complete payment.");
    } finally {
      setBusy(false);
    }
  }

  if (!allowed || !authReady || !emailAuthed || !uid) {
    return (
      <div className="space-y-3 pt-3">
        <BookingStepsBar step="summary" className="border-border border-b py-1.5" />
        <p className="text-muted-foreground text-sm">Preparing summary…</p>
      </div>
    );
  }

  const vehicleClass = selectedVehicleClass();
  const returnTotalHint =
    serviceType === "transfer" && itinerary === "return"
      ? "Return trip fare is recomputed at confirmation."
      : null;

  return (
    <div className="pb-28 lg:pb-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-8">
        <div className="min-w-0">
          <div className="border-border bg-background sticky top-16 z-30 border-b py-1.5">
            <BookingStepsBar step="summary" />
          </div>
          <div className="pt-3">
            <BookingPaymentPanel
              uid={uid}
              clientSecret={clientSecret}
              isPreparingCard={isPreparingCard}
              saveCard={saveCard}
              onSaveCardChange={handleSaveCardChange}
              selection={selection}
              onSelectionChange={setSelection}
              paymentFormRef={paymentFormRef}
              onPaymentError={setError}
            />
            {error ? <p className="text-destructive mt-4 text-sm">{error}</p> : null}
          </div>
        </div>

        <aside
          className={cn(
            "border-border bg-background space-y-5 border p-4",
            "lg:mt-10 lg:sticky lg:top-[6.5rem]"
          )}>
          <RouteMap
            pickup={pickup?.coordinate ?? null}
            dropoff={dropoff?.coordinate ?? null}
            geometry={route?.geometry ?? null}
          />

          <div className="flex items-start justify-between gap-3">
            {vehicleClass ? (
              <p className="font-medium">{vehicleClass.displayName}</p>
            ) : (
              <p className="text-muted-foreground text-sm">Vehicle class</p>
            )}
            {route ? (
              <p className="text-muted-foreground shrink-0 text-sm">
                {formatDistanceKm(route.distanceMeters)} ·{" "}
                {formatDurationMinutes(route.durationSeconds)}
              </p>
            ) : null}
          </div>

          {quote ? (
            <>
              <QuoteBreakdown quote={quote} />
              <p className="text-muted-foreground text-xs">
                Estimate only. Final fare is confirmed at booking.
                {returnTotalHint ? ` ${returnTotalHint}` : ""}
              </p>
            </>
          ) : null}

          <Link
            href="/booking"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "hidden w-full lg:inline-flex"
            )}>
            Back to estimate
          </Link>

          <button
            type="button"
            disabled={busy || (selection.mode === "new" && (!clientSecret || isPreparingCard))}
            onClick={() => void handleBookNow()}
            className={cn(
              buttonVariants({ size: "lg" }),
              "hidden w-full justify-between lg:inline-flex",
              (busy || (selection.mode === "new" && (!clientSecret || isPreparingCard))) &&
                "opacity-45"
            )}>
            <span>{busy ? "Booking…" : "Book now"}</span>
            <span>{quote ? formatMoney(quote.displayTotal, quote.currencyCode) : "—"}</span>
          </button>
        </aside>
      </div>

      <div className="border-border bg-background fixed inset-x-0 bottom-0 border-t px-4 py-4 lg:hidden">
        <div className="mx-auto flex max-w-6xl gap-3">
          <Link
            href="/booking"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "flex-1")}>
            Back
          </Link>
          <button
            type="button"
            disabled={busy || (selection.mode === "new" && (!clientSecret || isPreparingCard))}
            onClick={() => void handleBookNow()}
            className={cn(
              buttonVariants({ size: "lg" }),
              "flex-1 justify-between",
              (busy || (selection.mode === "new" && (!clientSecret || isPreparingCard))) &&
                "opacity-45"
            )}>
            <span>{busy ? "Booking…" : "Book now"}</span>
            <span>{quote ? formatMoney(quote.displayTotal, quote.currencyCode) : "—"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
