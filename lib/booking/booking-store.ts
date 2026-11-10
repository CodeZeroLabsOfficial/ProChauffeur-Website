"use client";

import { create } from "zustand";

import { fetchBranches, fetchPricingConfig, fetchVehicleClasses } from "@/lib/booking/catalog";
import { filterEligibleVehicleClasses } from "@/lib/booking/eligibility";
import { buildTripQuoteRemote } from "@/lib/booking/quote-api";
import {
  BranchResolveError,
  extractPostcodeFromAddress,
  resolveBranchId
} from "@/lib/booking/resolve-branch";
import { ensureAnonymousAuth } from "@/lib/firebase/ensure-anonymous";
import type { Branch } from "@/lib/models/branch";
import type { CoordinateField } from "@/lib/models/coordinate";
import type { PricingAddon } from "@/lib/models/pricing";
import type { QuoteResult } from "@/lib/models/quote";
import type { VehicleClass } from "@/lib/models/vehicle-class";
import { fetchDrivingRoute, type RouteEstimate } from "@/lib/mapbox/directions";
import type { GeocodeSuggestion } from "@/lib/mapbox/geocode";

export type SelectedPlace = {
  addressLine: string;
  coordinate: CoordinateField;
  postcode: string;
};

type BookingStore = {
  ready: boolean;
  bootError: string | null;
  branches: Branch[];
  branchId: string | null;
  pricingNotice: string | null;
  isPickupOutsideServiceArea: boolean;

  pickup: SelectedPlace | null;
  dropoff: SelectedPlace | null;
  scheduledPickupAt: Date;
  passengers: number;
  smallLuggage: number;
  largeLuggage: number;

  vehicleClasses: VehicleClass[];
  selectedVehicleClassId: string | null;
  selectedAddonIds: string[];
  availableAddons: PricingAddon[];

  route: RouteEstimate | null;
  isRouting: boolean;
  quote: QuoteResult | null;
  isQuoting: boolean;
  quoteError: string | null;

  bootstrap: (seed?: {
    pickupText?: string;
    dropoffText?: string;
    scheduledPickupAt?: string;
  }) => Promise<void>;
  setPickup: (place: SelectedPlace | null) => void;
  setDropoff: (place: SelectedPlace | null) => void;
  setScheduledPickupAt: (date: Date) => void;
  setPassengers: (count: number) => void;
  selectVehicleClass: (id: string) => void;
  toggleAddon: (id: string) => void;
  refreshRouteAndQuote: () => Promise<void>;
  bookableVehicleClasses: () => VehicleClass[];
  selectedVehicleClass: () => VehicleClass | null;
};

function defaultPickupDate(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  return d;
}

async function resolvePlaceFromText(text: string): Promise<SelectedPlace | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const { searchAddresses } = await import("@/lib/mapbox/geocode");
  const results = await searchAddresses(trimmed, { limit: 1 });
  const first = results[0] as GeocodeSuggestion | undefined;
  if (!first) return null;
  return {
    addressLine: first.addressLine,
    coordinate: first.coordinate,
    postcode: first.postcode || extractPostcodeFromAddress(first.addressLine)
  };
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  ready: false,
  bootError: null,
  branches: [],
  branchId: null,
  pricingNotice: null,
  isPickupOutsideServiceArea: false,

  pickup: null,
  dropoff: null,
  scheduledPickupAt: defaultPickupDate(),
  passengers: 1,
  smallLuggage: 0,
  largeLuggage: 0,

  vehicleClasses: [],
  selectedVehicleClassId: null,
  selectedAddonIds: [],
  availableAddons: [],

  route: null,
  isRouting: false,
  quote: null,
  isQuoting: false,
  quoteError: null,

  bookableVehicleClasses() {
    const state = get();
    return filterEligibleVehicleClasses(state.vehicleClasses, {
      tripType: "transfer",
      passengers: state.passengers,
      smallLuggage: state.smallLuggage,
      largeLuggage: state.largeLuggage
    });
  },

  selectedVehicleClass() {
    const state = get();
    const id = state.selectedVehicleClassId;
    if (!id) return null;
    return state.bookableVehicleClasses().find((row) => row.id === id) ?? null;
  },

  async bootstrap(seed) {
    try {
      await ensureAnonymousAuth();
      const branches = await fetchBranches();
      set({ branches, ready: true, bootError: null });

      if (seed?.scheduledPickupAt) {
        const parsed = new Date(seed.scheduledPickupAt);
        if (!Number.isNaN(parsed.getTime())) {
          set({ scheduledPickupAt: parsed });
        }
      }

      if (seed?.pickupText) {
        const pickup = await resolvePlaceFromText(seed.pickupText);
        if (pickup) get().setPickup(pickup);
      }
      if (seed?.dropoffText) {
        const dropoff = await resolvePlaceFromText(seed.dropoffText);
        if (dropoff) get().setDropoff(dropoff);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start booking. Check env and Auth.";
      set({ bootError: message, ready: false });
    }
  },

  setPickup(place) {
    set({ pickup: place, quote: null, quoteError: null });
    void get().refreshRouteAndQuote();
  },

  setDropoff(place) {
    set({ dropoff: place, quote: null, quoteError: null });
    void get().refreshRouteAndQuote();
  },

  setScheduledPickupAt(date) {
    set({ scheduledPickupAt: date, quote: null });
    void get().refreshRouteAndQuote();
  },

  setPassengers(count) {
    set({ passengers: Math.max(1, count), quote: null });
    const bookable = get().bookableVehicleClasses();
    const selected = get().selectedVehicleClassId;
    if (selected && !bookable.some((row) => row.id === selected)) {
      set({ selectedVehicleClassId: bookable[0]?.id ?? null, selectedAddonIds: [] });
    }
    void get().refreshRouteAndQuote();
  },

  selectVehicleClass(id) {
    set({ selectedVehicleClassId: id, selectedAddonIds: [], quote: null });
    void get().refreshRouteAndQuote();
  },

  toggleAddon(id) {
    const current = get().selectedAddonIds;
    const next = current.includes(id) ? current.filter((row) => row !== id) : [...current, id];
    set({ selectedAddonIds: next, quote: null });
    void get().refreshRouteAndQuote();
  },

  async refreshRouteAndQuote() {
    const state = get();
    const pickup = state.pickup;
    const dropoff = state.dropoff;

    if (!pickup || !dropoff) {
      set({
        route: null,
        quote: null,
        branchId: null,
        vehicleClasses: [],
        availableAddons: [],
        isPickupOutsideServiceArea: false,
        pricingNotice: null,
        isRouting: false,
        isQuoting: false
      });
      return;
    }

    set({ isRouting: true, quoteError: null, pricingNotice: null });

    try {
      let branchId: string;
      try {
        branchId = resolveBranchId({
          postcode: pickup.postcode || extractPostcodeFromAddress(pickup.addressLine),
          latitude: pickup.coordinate.latitude,
          longitude: pickup.coordinate.longitude,
          branches: state.branches
        });
      } catch (error) {
        if (error instanceof BranchResolveError) {
          set({
            isPickupOutsideServiceArea: error.kind === "out_of_area",
            pricingNotice: error.message,
            branchId: null,
            vehicleClasses: [],
            availableAddons: [],
            route: null,
            quote: null,
            isRouting: false,
            isQuoting: false
          });
          return;
        }
        throw error;
      }

      const [route, vehicleClasses, pricing] = await Promise.all([
        fetchDrivingRoute(pickup.coordinate, dropoff.coordinate),
        fetchVehicleClasses(branchId),
        fetchPricingConfig(branchId)
      ]);

      const bookable = filterEligibleVehicleClasses(vehicleClasses, {
        tripType: "transfer",
        passengers: get().passengers,
        smallLuggage: get().smallLuggage,
        largeLuggage: get().largeLuggage
      });

      let selectedVehicleClassId = get().selectedVehicleClassId;
      if (!selectedVehicleClassId || !bookable.some((row) => row.id === selectedVehicleClassId)) {
        selectedVehicleClassId = bookable[0]?.id ?? null;
      }

      const availableAddons = (pricing?.addons ?? []).filter((addon) => {
        if (!addon.tripTypes.includes("transfer")) return false;
        if (addon.vehicleClassIds.length === 0) return true;
        return selectedVehicleClassId
          ? addon.vehicleClassIds.includes(selectedVehicleClassId)
          : false;
      });

      const selectedAddonIds = get().selectedAddonIds.filter((id) =>
        availableAddons.some((addon) => addon.id === id)
      );

      set({
        branchId,
        vehicleClasses,
        selectedVehicleClassId,
        availableAddons,
        selectedAddonIds,
        route,
        isPickupOutsideServiceArea: false,
        isRouting: false
      });

      if (!selectedVehicleClassId) {
        set({
          quote: null,
          pricingNotice: "No vehicle classes are available for this trip.",
          isQuoting: false
        });
        return;
      }

      set({ isQuoting: true });
      const quote = await buildTripQuoteRemote({
        branchId,
        tripType: "transfer",
        vehicleClassId: selectedVehicleClassId,
        pickup: pickup.coordinate,
        dropoff: dropoff.coordinate,
        pickupAddressLine: pickup.addressLine,
        dropoffAddressLine: dropoff.addressLine,
        scheduledPickupAt: get().scheduledPickupAt,
        addonIds: selectedAddonIds
      });
      set({ quote, isQuoting: false, quoteError: null, pricingNotice: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not update the estimate.";
      set({
        isRouting: false,
        isQuoting: false,
        quote: null,
        quoteError: message
      });
    }
  }
}));
