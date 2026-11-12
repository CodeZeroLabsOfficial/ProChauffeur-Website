import type { DocumentData } from "firebase/firestore";

import { asDate, asDateRequired } from "@/lib/firebase/timestamps";
import { TRIP_STATUSES, type TripStatus, type TripType } from "@/lib/models/enums";
import type { PricingAddon } from "@/lib/models/pricing";
import type { Trip } from "@/lib/models/trip";

function asTripStatus(value: unknown): TripStatus {
  return TRIP_STATUSES.includes(value as TripStatus) ? (value as TripStatus) : "requested";
}

function asCoordinate(raw: unknown) {
  const obj = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    latitude: Number(obj.latitude) || 0,
    longitude: Number(obj.longitude) || 0
  };
}

function asAddons(raw: unknown): PricingAddon[] | null {
  if (!Array.isArray(raw)) return null;
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : "";
      const title = typeof row.title === "string" ? row.title : "";
      if (!id || !title) return null;
      return {
        id,
        title,
        price: Number(row.price) || 0,
        isEnabled: row.isEnabled !== false,
        tripTypes: Array.isArray(row.tripTypes) ? (row.tripTypes as TripType[]) : [],
        vehicleClassIds: Array.isArray(row.vehicleClassIds)
          ? (row.vehicleClassIds as string[])
          : []
      } satisfies PricingAddon;
    })
    .filter((item): item is PricingAddon => item != null);
}

export function parseTrip(id: string, data: DocumentData, branchId?: string | null): Trip {
  const journey = (data.journey && typeof data.journey === "object"
    ? data.journey
    : {}) as Record<string, unknown>;
  const quote = (data.quote && typeof data.quote === "object" ? data.quote : {}) as Record<
    string,
    unknown
  >;
  const billing = (data.billing && typeof data.billing === "object"
    ? data.billing
    : {}) as Record<string, unknown>;
  const vehicle = (data.vehicle && typeof data.vehicle === "object"
    ? data.vehicle
    : {}) as Record<string, unknown>;
  const customer = (data.customer && typeof data.customer === "object"
    ? data.customer
    : {}) as Record<string, unknown>;
  const driver = (data.driver && typeof data.driver === "object"
    ? data.driver
    : {}) as Record<string, unknown>;
  const capacity = (data.capacity && typeof data.capacity === "object"
    ? data.capacity
    : {}) as Record<string, unknown>;
  const luggage = (capacity.luggage && typeof capacity.luggage === "object"
    ? capacity.luggage
    : {}) as Record<string, unknown>;
  const snap =
    vehicle.vehicleSnapshot && typeof vehicle.vehicleSnapshot === "object"
      ? (vehicle.vehicleSnapshot as Record<string, unknown>)
      : null;

  return {
    id,
    status: asTripStatus(data.status),
    customerID: typeof data.customerID === "string" ? data.customerID : "",
    driverID: typeof data.driverID === "string" ? data.driverID : null,
    branchId:
      typeof data.branchId === "string"
        ? data.branchId
        : typeof branchId === "string"
          ? branchId
          : null,
    customer: {
      displayName: typeof customer.displayName === "string" ? customer.displayName : null,
      phoneNumber: typeof customer.phoneNumber === "string" ? customer.phoneNumber : null,
      email: typeof customer.email === "string" ? customer.email : null
    },
    driver: {
      displayName: typeof driver.displayName === "string" ? driver.displayName : null,
      phoneNumber: typeof driver.phoneNumber === "string" ? driver.phoneNumber : null,
      photoURL: typeof driver.photoURL === "string" ? driver.photoURL : null
    },
    capacity: {
      passengerCount: Number(capacity.passengerCount) || 1,
      luggage: {
        smallCount: Number(luggage.smallCount) || 0,
        largeCount: Number(luggage.largeCount) || 0
      }
    },
    journey: {
      pickup: asCoordinate(journey.pickup),
      dropoff: asCoordinate(journey.dropoff),
      pickupAddressLine:
        typeof journey.pickupAddressLine === "string" ? journey.pickupAddressLine : null,
      dropoffAddressLine:
        typeof journey.dropoffAddressLine === "string" ? journey.dropoffAddressLine : null,
      notes: typeof journey.notes === "string" ? journey.notes : null,
      bookingAddons: asAddons(journey.bookingAddons),
      scheduledPickupAt: asDate(journey.scheduledPickupAt),
      linkedTripID: typeof journey.linkedTripID === "string" ? journey.linkedTripID : null,
      tripType: typeof journey.tripType === "string" ? (journey.tripType as TripType) : null,
      bookedHours: typeof journey.bookedHours === "number" ? journey.bookedHours : null
    },
    quote: {
      vehicleClassId: typeof quote.vehicleClassId === "string" ? quote.vehicleClassId : null,
      vehicleClassDisplayName:
        typeof quote.vehicleClassDisplayName === "string" ? quote.vehicleClassDisplayName : null,
      quotedSubtotal: typeof quote.quotedSubtotal === "number" ? quote.quotedSubtotal : null,
      quotedTaxAmount: typeof quote.quotedTaxAmount === "number" ? quote.quotedTaxAmount : null,
      quotedTotal: typeof quote.quotedTotal === "number" ? quote.quotedTotal : null,
      quotedCurrencyCode:
        typeof quote.quotedCurrencyCode === "string" ? quote.quotedCurrencyCode : null,
      quotedTaxRate: typeof quote.quotedTaxRate === "number" ? quote.quotedTaxRate : null
    },
    billing: {
      paymentStatus:
        typeof billing.paymentStatus === "string"
          ? (billing.paymentStatus as Trip["billing"]["paymentStatus"])
          : null,
      stripePaymentIntentId:
        typeof billing.stripePaymentIntentId === "string" ? billing.stripePaymentIntentId : null,
      invoiceId: typeof billing.invoiceId === "string" ? billing.invoiceId : null,
      corporateAccountId:
        typeof billing.corporateAccountId === "string" ? billing.corporateAccountId : null,
      paidAt: asDate(billing.paidAt)
    },
    vehicle: {
      vehicleDocumentId:
        typeof vehicle.vehicleDocumentId === "string" ? vehicle.vehicleDocumentId : null,
      vehicleSnapshot: snap
        ? {
            vehicleID: typeof snap.vehicleID === "string" ? snap.vehicleID : undefined,
            make: typeof snap.make === "string" ? snap.make : null,
            model: typeof snap.model === "string" ? snap.model : null,
            registrationNumber:
              typeof snap.registrationNumber === "string" ? snap.registrationNumber : null,
            displayName: typeof snap.displayName === "string" ? snap.displayName : null
          }
        : null
    },
    createdAt: asDateRequired(data.createdAt),
    updatedAt: asDateRequired(data.updatedAt, asDateRequired(data.createdAt))
  };
}
