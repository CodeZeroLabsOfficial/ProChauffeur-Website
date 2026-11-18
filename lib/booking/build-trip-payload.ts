import type { SelectedPlace } from "@/lib/booking/booking-store";
import type { PricingAddon } from "@/lib/models/pricing";
import type { QuoteResult } from "@/lib/models/quote";
import type { BookableServiceType, ServiceType } from "@/lib/models/enums";
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
    serviceType: BookableServiceType;
    pickup: { latitude: number; longitude: number };
    dropoff: { latitude: number; longitude: number };
    pickupAddressLine: string;
    dropoffAddressLine: string;
    scheduledPickupAt: string;
    bookedHours: number | null;
    bookingAddons: Array<{
      id: string;
      title: string;
      price: number;
      isEnabled: boolean;
      serviceTypes: ServiceType[];
      vehicleClassIds: string[];
    }>;
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

export type BookingTripIds = {
  outboundId: string;
  returnId: string | null;
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
  serviceType: BookableServiceType;
  hourlyHours: number;
  passengers: number;
  smallLuggage: number;
  largeLuggage: number;
  vehicleClass: VehicleClass;
  selectedAddons: PricingAddon[];
  quote: QuoteResult;
  tripIds?: BookingTripIds;
};

export function newBookingTripId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `trip_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function allocateBookingTripIds(needsReturn: boolean): BookingTripIds {
  return {
    outboundId: newBookingTripId(),
    returnId: needsReturn ? newBookingTripId() : null
  };
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
      serviceType: input.serviceType,
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
      bookedHours: input.serviceType === "hourly" ? input.hourlyHours : null,
      bookingAddons: input.selectedAddons.map((addon) => ({
        id: addon.id,
        title: addon.title,
        price: addon.price,
        isEnabled: addon.isEnabled,
        serviceTypes: addon.serviceTypes,
        vehicleClassIds: addon.vehicleClassIds
      })),
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

function isReturnItinerary(input: BuildTripPayloadInput): boolean {
  return (
    input.serviceType === "transfer" &&
    input.itinerary === "return" &&
    input.scheduledReturnAt instanceof Date &&
    !Number.isNaN(input.scheduledReturnAt.getTime())
  );
}

/** Builds one or two pending trip docs matching paymentsCreateCardPayment contract. */
export function buildTripPayloads(input: BuildTripPayloadInput): BookingTripPayload[] {
  const isReturn = isReturnItinerary(input);
  const ids =
    input.tripIds ??
    allocateBookingTripIds(isReturn);
  const outboundId = ids.outboundId;
  const returnId = isReturn ? ids.returnId ?? newBookingTripId() : null;

  if (!isReturn || !returnId) {
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
