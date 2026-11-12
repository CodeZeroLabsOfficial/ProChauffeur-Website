export const TRIP_TYPES = ["transfer", "hourly"] as const;
export type TripType = (typeof TRIP_TYPES)[number];

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
