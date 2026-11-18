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
  adults: number;
  children: number;
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
    const parsed = JSON.parse(raw) as Partial<BookingSessionSnapshot>;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.scheduledPickupAt !== "string") return null;
    if (parsed.serviceType !== "transfer" && parsed.serviceType !== "hourly") return null;
    if (parsed.itinerary !== "oneWay" && parsed.itinerary !== "return") return null;

    const passengers = Math.max(1, Number(parsed.passengers) || 1);
    const adults = Math.max(1, Number(parsed.adults) || passengers);
    const children = Math.max(0, Number(parsed.children) || 0);

    return {
      pickup: parsed.pickup ?? null,
      dropoff: parsed.dropoff ?? null,
      scheduledPickupAt: parsed.scheduledPickupAt,
      scheduledReturnAt: parsed.scheduledReturnAt ?? null,
      serviceType: parsed.serviceType,
      itinerary: parsed.itinerary,
      hourlyHours: Math.max(1, Number(parsed.hourlyHours) || 1),
      passengers: Math.max(passengers, adults + children),
      adults,
      children,
      smallLuggage: Math.max(0, Number(parsed.smallLuggage) || 0),
      largeLuggage: Math.max(0, Number(parsed.largeLuggage) || 0),
      selectedVehicleClassId: parsed.selectedVehicleClassId ?? null,
      selectedAddonIds: Array.isArray(parsed.selectedAddonIds) ? parsed.selectedAddonIds : []
    };
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
