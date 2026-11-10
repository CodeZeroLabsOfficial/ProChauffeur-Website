import type { SelectedPlace } from "@/lib/booking/booking-store";
import type { PricingAddon } from "@/lib/models/pricing";
import type { QuoteResult } from "@/lib/models/quote";
import type { TripType } from "@/lib/models/enums";
import type { VehicleClass } from "@/lib/models/vehicle-class";

export type BookingTripPayload = {
  id: string;
  status: "requested";
  customerID: string;
  customer: {
    email: string | null;
    displayName: string | null;
  };
  capacity: {
    passengerCount: number;
    luggage: { smallCount: number; largeCount: number };
  };
  journey: {
    tripType: TripType;
    pickup: { latitude: number; longitude: number };
    dropoff: { latitude: number; longitude: number };
    pickupAddressLine: string;
    dropoffAddressLine: string;
    scheduledPickupAt: string;
    bookedHours: number | null;
    bookingAddons: PricingAddon[];
    addonIds: string[];
    linkedTripID: string | null;
    notes: string | null;
  };
  quote: {
    vehicleClassId: string;
    vehicleClassDisplayName: string | null;
    quotedSubtotal: number;
    quotedTaxAmount: number;
    quotedTotal: number;
    quotedCurrencyCode: string;
    quotedTaxRate: number | null;
    quotedPricesIncludeTax: boolean | null;
    quoteBreakdown: QuoteResult["breakdown"];
  };
  billing: {
    paymentStatus: "pending";
    paymentSource: "web";
    corporateAccountId: null;
  };
  driver: Record<string, never>;
  vehicle: Record<string, never>;
  driverID: null;
};

export type BuildTripPayloadInput = {
  customerId: string;
  customerEmail: string | null;
  customerDisplayName: string | null;
  pickup: SelectedPlace;
  dropoff: SelectedPlace;
  scheduledPickupAt: Date;
  scheduledReturnAt: Date | null;
  itinerary: "oneWay" | "return";
  tripType: TripType;
  hourlyHours: number;
  passengers: number;
  smallLuggage: number;
  largeLuggage: number;
  vehicleClass: VehicleClass;
  selectedAddons: PricingAddon[];
  quote: QuoteResult;
};

function newTripId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `trip_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function legPayload(
  input: BuildTripPayloadInput,
  args: {
    id: string;
    pickup: SelectedPlace;
    dropoff: SelectedPlace;
    scheduledPickupAt: Date;
    linkedTripID: string | null;
  }
): BookingTripPayload {
  return {
    id: args.id,
    status: "requested",
    customerID: input.customerId,
    customer: {
      email: input.customerEmail,
      displayName: input.customerDisplayName
    },
    capacity: {
      passengerCount: input.passengers,
      luggage: {
        smallCount: input.smallLuggage,
        largeCount: input.largeLuggage
      }
    },
    journey: {
      tripType: input.tripType,
      pickup: {
        latitude: args.pickup.coordinate.latitude,
        longitude: args.pickup.coordinate.longitude
      },
      dropoff: {
        latitude: args.dropoff.coordinate.latitude,
        longitude: args.dropoff.coordinate.longitude
      },
      pickupAddressLine: args.pickup.addressLine,
      dropoffAddressLine: args.dropoff.addressLine,
      scheduledPickupAt: args.scheduledPickupAt.toISOString(),
      bookedHours: input.tripType === "hourly" ? input.hourlyHours : null,
      bookingAddons: input.selectedAddons,
      addonIds: input.selectedAddons.map((addon) => addon.id),
      linkedTripID: args.linkedTripID,
      notes: null
    },
    quote: {
      vehicleClassId: input.vehicleClass.id,
      vehicleClassDisplayName: input.vehicleClass.displayName,
      quotedSubtotal: input.quote.subtotal,
      quotedTaxAmount: input.quote.taxAmount,
      quotedTotal: input.quote.total,
      quotedCurrencyCode: input.quote.currencyCode,
      quotedTaxRate: input.quote.quotedTaxRate ?? null,
      quotedPricesIncludeTax: input.quote.quotedPricesIncludeTax ?? null,
      quoteBreakdown: input.quote.breakdown
    },
    billing: {
      paymentStatus: "pending",
      paymentSource: "web",
      corporateAccountId: null
    },
    driver: {},
    vehicle: {},
    driverID: null
  };
}

/** Builds one or two pending trip docs matching createTripCardPayment contract. */
export function buildTripPayloads(input: BuildTripPayloadInput): BookingTripPayload[] {
  const outboundId = newTripId();
  const isReturn =
    input.tripType === "transfer" &&
    input.itinerary === "return" &&
    input.scheduledReturnAt instanceof Date &&
    !Number.isNaN(input.scheduledReturnAt.getTime());

  if (!isReturn) {
    return [
      legPayload(input, {
        id: outboundId,
        pickup: input.pickup,
        dropoff: input.dropoff,
        scheduledPickupAt: input.scheduledPickupAt,
        linkedTripID: null
      })
    ];
  }

  const returnId = newTripId();
  return [
    legPayload(input, {
      id: outboundId,
      pickup: input.pickup,
      dropoff: input.dropoff,
      scheduledPickupAt: input.scheduledPickupAt,
      linkedTripID: returnId
    }),
    legPayload(input, {
      id: returnId,
      pickup: input.dropoff,
      dropoff: input.pickup,
      scheduledPickupAt: input.scheduledReturnAt as Date,
      linkedTripID: outboundId
    })
  ];
}
