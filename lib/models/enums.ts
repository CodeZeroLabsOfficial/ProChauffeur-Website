export const TRIP_TYPES = ["transfer", "hourly"] as const;
export type TripType = (typeof TRIP_TYPES)[number];
