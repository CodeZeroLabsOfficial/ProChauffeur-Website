import type { PaymentStatus, TripStatus, TripType } from "@/lib/models/enums";
import type { PricingAddon } from "@/lib/models/pricing";
import type { CoordinateField } from "@/lib/models/coordinate";

export type TripCustomer = {
  displayName?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
};

export type TripDriver = {
  displayName?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
};

export type TripCapacity = {
  passengerCount: number;
  luggage: { smallCount: number; largeCount: number };
};

export type TripJourney = {
  pickup: CoordinateField;
  dropoff: CoordinateField;
  pickupAddressLine?: string | null;
  dropoffAddressLine?: string | null;
  notes?: string | null;
  bookingAddons?: PricingAddon[] | null;
  scheduledPickupAt?: Date | null;
  linkedTripID?: string | null;
  tripType?: TripType | null;
  bookedHours?: number | null;
};

export type TripQuote = {
  vehicleClassId?: string | null;
  vehicleClassDisplayName?: string | null;
  quotedSubtotal?: number | null;
  quotedTaxAmount?: number | null;
  quotedTotal?: number | null;
  quotedCurrencyCode?: string | null;
  quotedTaxRate?: number | null;
};

export type TripBilling = {
  paymentStatus?: PaymentStatus | null;
  stripePaymentIntentId?: string | null;
  stripeReceiptUrl?: string | null;
  invoiceId?: string | null;
  corporateAccountId?: string | null;
  paidAt?: Date | null;
};

export type TripVehicleSnapshot = {
  vehicleID?: string;
  make?: string | null;
  model?: string | null;
  registrationNumber?: string | null;
  displayName?: string | null;
};

export type TripVehicle = {
  vehicleDocumentId?: string | null;
  vehicleSnapshot?: TripVehicleSnapshot | null;
};

/** Trip document at `branches/{branchId}/trips/{id}`. */
export type Trip = {
  id: string;
  status: TripStatus;
  customerID: string;
  driverID?: string | null;
  branchId?: string | null;
  customer: TripCustomer;
  driver: TripDriver;
  capacity: TripCapacity;
  journey: TripJourney;
  quote: TripQuote;
  billing: TripBilling;
  vehicle: TripVehicle;
  createdAt: Date;
  updatedAt: Date;
};

export function tripPickupReferenceDate(trip: Trip): Date {
  return trip.journey.scheduledPickupAt ?? trip.createdAt;
}

export function tripVehicleLabel(trip: Trip): string {
  const snap = trip.vehicle.vehicleSnapshot;
  if (snap?.displayName?.trim()) return snap.displayName.trim();
  const parts = [snap?.make, snap?.model].filter(Boolean);
  if (parts.length) return parts.join(" ");
  if (trip.quote.vehicleClassDisplayName?.trim()) {
    return trip.quote.vehicleClassDisplayName.trim();
  }
  return "—";
}

export function tripDriverLabel(trip: Trip): string {
  const name = trip.driver.displayName?.trim();
  return name || "Unassigned";
}

export function canCancelTrip(trip: Trip): boolean {
  return trip.status === "requested" || trip.status === "accepted";
}
