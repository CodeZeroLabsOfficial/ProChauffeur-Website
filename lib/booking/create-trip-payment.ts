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
      paymentMethodId?: string | null;
      saveCard?: boolean;
    },
    CreateTripCardPaymentResult
  >(firebaseFunctions(), "createTripCardPayment");

  try {
    const result = await callable({
      trips: input.trips,
      paymentMethodId: input.paymentMethodId ?? null,
      saveCard: Boolean(input.saveCard)
    });
    const data = result.data;
    if (!data?.clientSecret?.trim() || !data.tripId?.trim()) {
      throw new TripPaymentError("Payment could not be started.");
    }
    return data;
  } catch (error) {
    if (error instanceof TripPaymentError) throw error;
    throw new TripPaymentError(friendlyMessage(error, "Payment could not be started."));
  }
}
