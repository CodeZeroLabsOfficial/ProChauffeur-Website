"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { RouteMap } from "@/components/booking/route-map";
import { TripStatusBadge } from "@/components/dashboard/trip-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCustomerSession } from "@/lib/auth/use-customer-session";
import { cancelCustomerTrip, listenCustomerTrips } from "@/lib/dashboard/customer-trips";
import { formatDateTime, formatMoneyAmount, shortBookingId } from "@/lib/format";
import { paymentStatusTitle } from "@/lib/models/enums";
import {
  canCancelTrip,
  tripDriverLabel,
  tripPickupReferenceDate,
  tripVehicleLabel,
  type Trip
} from "@/lib/models/trip";

type TripDetailViewProps = {
  tripId: string;
};

export function TripDetailView({ tripId }: TripDetailViewProps) {
  const router = useRouter();
  const { user, isCustomer } = useCustomerSession();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isCustomer || !user?.uid) {
      setLoading(false);
      return;
    }
    return listenCustomerTrips(user.uid, (trips) => {
      setTrip(trips.find((item) => item.id === tripId) ?? null);
      setLoading(false);
    });
  }, [isCustomer, user?.uid, tripId]);

  const canCancel = trip ? canCancelTrip(trip) : false;

  const addons = useMemo(() => trip?.journey.bookingAddons ?? [], [trip]);

  async function handleCancel() {
    if (!trip || !canCancel) return;
    const confirmed = window.confirm("Cancel this booking?");
    if (!confirmed) return;
    setBusy(true);
    try {
      await cancelCustomerTrip(trip);
      toast.success("Booking cancelled.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel this booking.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading trip…</p>;
  }

  if (!trip) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">Trip not found.</p>
        <Link href="/dashboard/trips" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to My Trips
        </Link>
      </div>
    );
  }

  const total = trip.quote.quotedTotal;
  const currency = trip.quote.quotedCurrencyCode || "AUD";
  const paymentStatus = trip.billing.paymentStatus;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">Booking {shortBookingId(trip.id)}</p>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Trip details</h1>
          <TripStatusBadge status={trip.status} />
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/trips" className={cn(buttonVariants({ variant: "outline" }))}>
            Back
          </Link>
          {canCancel ? (
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={() => void handleCancel()}>
              {busy ? "Cancelling…" : "Cancel booking"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule & route</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Pickup</p>
              <p className="font-medium">{formatDateTime(tripPickupReferenceDate(trip))}</p>
              <p>{trip.journey.pickupAddressLine || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Drop-off</p>
              <p>{trip.journey.dropoffAddressLine || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Driver & vehicle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Driver</p>
              <p className="font-medium">{tripDriverLabel(trip)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vehicle</p>
              <p className="font-medium">{tripVehicleLabel(trip)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fare & payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Fare</p>
              <p className="font-medium">
                {typeof total === "number" ? formatMoneyAmount(total, currency) : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment status</p>
              <p className="font-medium">
                {paymentStatus ? paymentStatusTitle[paymentStatus] : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add-ons</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {addons.length ? (
              <ul className="space-y-1">
                {addons.map((addon) => (
                  <li key={addon.id} className="flex justify-between gap-3">
                    <span>{addon.title}</span>
                    <span className="text-muted-foreground">
                      {formatMoneyAmount(addon.price, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No add-ons.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 overflow-hidden rounded-lg">
            <RouteMap
              pickup={trip.journey.pickup}
              dropoff={trip.journey.dropoff}
              geometry={null}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
