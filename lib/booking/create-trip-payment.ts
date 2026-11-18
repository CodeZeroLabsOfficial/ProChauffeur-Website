"use client";

import { httpsCallable } from "firebase/functions";

import type { BookingTripPayload } from "@/lib/booking/build-trip-payload";
import { firebaseFunctions } from "@/lib/firebase/client";

export type CreateTripCardPaymentResult = {
  clientSecret: string;
  paymentIntentId: string;
  tripId: string;
  tripIds: string[];
  branchId: string;
  stripeCustomerId?: string;
};

type PaymentsCreateCardPaymentResponse = {
  clientSecret?: string;
  providerPaymentId?: string;
  tripId?: string;
  tripIds?: string[];
  branchId?: string;
  providerCustomerId?: string;
  provider?: string;
  publishableKey?: string;
};

export class TripPaymentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TripPaymentError";
  }
}

function friendlyMessage(error: unknown, fallback: string): string {
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: string }).message ?? "")
      : "";
  const cleaned = message.replace(/^Firebase:\s*/i, "").replace(/\s*\(.*\)\s*$/, "").trim();
  return cleaned || fallback;
}

/** Creates pending trips and a Stripe PaymentIntent; returns clientSecret for Elements. */
export async function createTripCardPayment(input: {
  trips: BookingTripPayload[];
  paymentMethodId?: string | null;
  saveCard?: boolean;
}): Promise<CreateTripCardPaymentResult> {
  if (!input.trips.length) {
    throw new TripPaymentError("No trips to book.");
  }

  const callable = httpsCallable<
    {
      trips: BookingTripPayload[];
      providerMethodId?: string | null;
      saveCard?: boolean;
    },
    PaymentsCreateCardPaymentResponse
  >(firebaseFunctions(), "paymentsCreateCardPayment");

  try {
    const result = await callable({
      trips: input.trips,
      providerMethodId: input.paymentMethodId ?? null,
      saveCard: Boolean(input.saveCard)
    });
    const data = result.data;
    const clientSecret = data?.clientSecret?.trim() ?? "";
    const tripId = data?.tripId?.trim() ?? "";
    const paymentIntentId = data?.providerPaymentId?.trim() ?? "";
    if (!clientSecret || !tripId || !paymentIntentId) {
      throw new TripPaymentError("Payment could not be started.");
    }
    return {
      clientSecret,
      paymentIntentId,
      tripId,
      tripIds: Array.isArray(data.tripIds) ? data.tripIds : [tripId],
      branchId: typeof data.branchId === "string" ? data.branchId : "",
      stripeCustomerId:
        typeof data.providerCustomerId === "string" ? data.providerCustomerId : undefined
    };
  } catch (error) {
    if (error instanceof TripPaymentError) throw error;
    throw new TripPaymentError(friendlyMessage(error, "Payment could not be started."));
  }
}
