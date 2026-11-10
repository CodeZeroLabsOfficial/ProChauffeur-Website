"use client";

import { httpsCallable } from "firebase/functions";

import { firebaseAuth, firebaseFunctions } from "@/lib/firebase/client";
import type { CoordinateField } from "@/lib/models/coordinate";
import type { TripType } from "@/lib/models/enums";
import type { QuoteLineItem, QuoteResult } from "@/lib/models/quote";

export type BuildTripQuoteInput = {
  branchId?: string | null;
  tripType: TripType;
  vehicleClassId: string;
  pickup: CoordinateField;
  dropoff: CoordinateField;
  pickupAddressLine: string;
  dropoffAddressLine: string;
  scheduledPickupAt: Date;
  bookedHours?: number | null;
  addonIds: string[];
};

type RemoteQuote = QuoteResult & {
  breakdown?: QuoteLineItem[];
};

export async function buildTripQuoteRemote(input: BuildTripQuoteInput): Promise<QuoteResult> {
  const user = firebaseAuth().currentUser;
  if (!user) {
    throw new Error("Sign in required to get a quote.");
  }

  const callable = httpsCallable<
    {
      branchId?: string | null;
      customerId: string;
      settlement: "card";
      trip: {
        journey: {
          tripType: TripType;
          pickup: CoordinateField;
          dropoff: CoordinateField;
          pickupAddressLine: string;
          dropoffAddressLine: string;
          scheduledPickupAt: string;
          bookedHours: number | null;
          addonIds: string[];
        };
        quote: { vehicleClassId: string };
      };
    },
    RemoteQuote
  >(firebaseFunctions(), "buildTripQuote");

  let result;
  try {
    result = await callable({
      branchId: input.branchId ?? null,
      customerId: user.uid,
      settlement: "card",
      trip: {
        journey: {
          tripType: input.tripType,
          pickup: input.pickup,
          dropoff: input.dropoff,
          pickupAddressLine: input.pickupAddressLine,
          dropoffAddressLine: input.dropoffAddressLine,
          scheduledPickupAt: input.scheduledPickupAt.toISOString(),
          bookedHours: input.bookedHours ?? null,
          addonIds: input.addonIds
        },
        quote: {
          vehicleClassId: input.vehicleClassId
        }
      }
    });
  } catch (error) {
    const message =
      typeof error === "object" &&
      error &&
      "message" in error &&
      typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : "Could not build a fare estimate.";
    throw new Error(message.replace(/^Firebase:\s*/i, "").replace(/\s*\([^)]*\)\s*$/, ""));
  }

  const data = result.data;
  return {
    subtotal: data.subtotal,
    taxAmount: data.taxAmount,
    total: data.total,
    currencyCode: data.currencyCode,
    breakdown: Array.isArray(data.breakdown) ? data.breakdown : [],
    displayTotal: data.displayTotal ?? data.total,
    quotedPricesIncludeTax: Boolean(data.quotedPricesIncludeTax),
    quotedTaxRate: typeof data.quotedTaxRate === "number" ? data.quotedTaxRate : 0
  };
}

export function formatMoney(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode || "AUD"
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
}
