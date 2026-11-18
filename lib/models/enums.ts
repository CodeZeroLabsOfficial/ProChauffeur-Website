export const SERVICE_TYPES = ["transfer", "hourly", "round_trip"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

/** Bookable services on the customer website (return uses itinerary + transfer). */
export const BOOKABLE_SERVICE_TYPES = ["transfer", "hourly"] as const;
export type BookableServiceType = (typeof BOOKABLE_SERVICE_TYPES)[number];

export const serviceTypeTitle: Record<ServiceType, string> = {
  transfer: "Point-to-Point",
  hourly: "Hourly",
  round_trip: "Round trip"
};

export const TRIP_STATUSES = [
  "requested",
  "accepted",
  "en_route_pickup",
  "in_progress",
  "completed",
  "cancelled"
] as const;
export type TripStatus = (typeof TRIP_STATUSES)[number];

export const tripStatusTitle: Record<TripStatus, string> = {
  requested: "Requested",
  accepted: "Accepted",
  en_route_pickup: "Enroute",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled"
};

export const PAYMENT_STATUSES = [
  "unpaid",
  "pending",
  "paid",
  "failed",
  "invoiced",
  "on_account",
  "refunded"
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const paymentStatusTitle: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "Payment pending",
  paid: "Paid",
  failed: "Payment failed",
  invoiced: "Invoiced",
  on_account: "On account",
  refunded: "Refunded"
};

export const USER_ROLES = ["customer", "driver", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];
