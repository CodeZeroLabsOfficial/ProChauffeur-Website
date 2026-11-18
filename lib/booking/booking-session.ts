import type { SelectedPlace } from "@/lib/booking/booking-store";
import type { BookableServiceType } from "@/lib/models/enums";

const STORAGE_KEY = "pc.booking.journey.v1";

export type BookingSessionSnapshot = {
  pickup: SelectedPlace | null;
  dropoff: SelectedPlace | null;
  scheduledPickupAt: string;
  scheduledReturnAt: string | null;
  serviceType: BookableServiceType;
  itinerary: "oneWay" | "return";
  hourlyHours: number;
  passengers: number;
  smallLuggage: number;
  largeLuggage: number;
  selectedVehicleClassId: string | null;
  selectedAddonIds: string[];
};

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof sessionStorage !== "undefined";
}

export function saveBookingSession(snapshot: BookingSessionSnapshot): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

export function loadBookingSession(): BookingSessionSnapshot | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BookingSessionSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.scheduledPickupAt !== "string") return null;
    if (parsed.serviceType !== "transfer" && parsed.serviceType !== "hourly") return null;
    if (parsed.itinerary !== "oneWay" && parsed.itinerary !== "return") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearBookingSession(): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
