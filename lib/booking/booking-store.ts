"use client";

import { create } from "zustand";

import { getBookingCatalog } from "@/lib/booking/catalog";
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
import type { TripType } from "@/lib/models/enums";
import type { PricingAddon } from "@/lib/models/pricing";
import type { QuoteResult } from "@/lib/models/quote";
import type { VehicleClass } from "@/lib/models/vehicle-class";
import { fetchDrivingRoute, type RouteEstimate } from "@/lib/mapbox/directions";

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
  mapboxCountry: string | null;
  mapboxProximity: CoordinateField | null;

  pickup: SelectedPlace | null;
  dropoff: SelectedPlace | null;
  scheduledPickupAt: Date;
  scheduledReturnAt: Date | null;
  tripType: TripType;
  itinerary: "oneWay" | "return";
  hourlyHours: number;
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
    scheduledReturnAt?: string;
    itinerary?: "oneWay" | "return";
    tripType?: TripType;
    hourlyHours?: number;
  }) => Promise<void>;
  setPickup: (place: SelectedPlace | null) => void;
  setDropoff: (place: SelectedPlace | null) => void;
  setScheduledPickupAt: (date: Date) => void;
  setScheduledReturnAt: (date: Date | null) => void;
  setTripType: (tripType: TripType) => void;
  setItinerary: (itinerary: "oneWay" | "return") => void;
  setHourlyHours: (hours: number) => void;
  setPassengers: (count: number) => void;
  setSmallLuggage: (count: number) => void;
  setLargeLuggage: (count: number) => void;
  selectVehicleClass: (id: string) => void;
  toggleAddon: (id: string) => void;
  refreshRouteAndQuote: () => Promise<void>;
  bookableVehicleClasses: () => VehicleClass[];
  selectedVehicleClass: () => VehicleClass | null;
  canProceedFromEstimate: () => boolean;
  canProceedFromDetails: () => boolean;
};

function defaultPickupDate(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 2);
  return d;
}

async function resolvePlaceFromText(
  text: string,
  options?: { country?: string | null; proximity?: CoordinateField | null }
): Promise<SelectedPlace | null> {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const {
    createMapboxSearchSessionToken,
    resolveAddressHit,
    searchAddresses
  } = await import("@/lib/mapbox/address-search");
  const sessionToken = createMapboxSearchSessionToken();
  const results = await searchAddresses(trimmed, sessionToken, {
    limit: 1,
    country: options?.country,
    proximity: options?.proximity
  });
  const first = results[0];
  if (!first) return null;
  const resolved = await resolveAddressHit(first, sessionToken);
  return {
    addressLine: resolved.addressLine,
    coordinate: resolved.coordinate,
    postcode: resolved.postcode || extractPostcodeFromAddress(resolved.addressLine)
  };
}

function filterAddonsForSelection(
  addons: PricingAddon[],
  tripType: TripType,
  vehicleClassId: string | null
): PricingAddon[] {
  return addons.filter((addon) => {
    if (!addon.tripTypes.includes(tripType)) return false;
    if (addon.vehicleClassIds.length === 0) return true;
    return vehicleClassId ? addon.vehicleClassIds.includes(vehicleClassId) : false;
  });
}

export const useBookingStore = create<BookingStore>((set, get) => ({
  ready: false,
  bootError: null,
  branches: [],
  branchId: null,
  pricingNotice: null,
  isPickupOutsideServiceArea: false,
  mapboxCountry: null,
  mapboxProximity: null,

  pickup: null,
  dropoff: null,
  scheduledPickupAt: defaultPickupDate(),
  scheduledReturnAt: null,
  tripType: "transfer",
  itinerary: "oneWay",
  hourlyHours: 3,
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
      tripType: state.tripType,
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
      const catalog = await getBookingCatalog();
      set({
        branches: catalog.branches,
        mapboxCountry: catalog.mapbox.country,
        mapboxProximity: catalog.mapbox.proximity,
        ready: true,
        bootError: null
      });

      if (seed?.tripType === "transfer" || seed?.tripType === "hourly") {
        set({ tripType: seed.tripType });
      }

      if (seed?.itinerary === "return" || seed?.itinerary === "oneWay") {
        set({ itinerary: seed.itinerary });
      }

      if (typeof seed?.hourlyHours === "number" && seed.hourlyHours > 0) {
        set({ hourlyHours: seed.hourlyHours });
      }

      if (seed?.scheduledPickupAt) {
        const parsed = new Date(seed.scheduledPickupAt);
        if (!Number.isNaN(parsed.getTime())) {
          set({ scheduledPickupAt: parsed });
        }
      }

      if (seed?.scheduledReturnAt) {
        const parsed = new Date(seed.scheduledReturnAt);
        if (!Number.isNaN(parsed.getTime())) {
          set({ scheduledReturnAt: parsed, itinerary: "return", tripType: "transfer" });
        }
      }

      const searchOpts = {
        country: catalog.mapbox.country,
        proximity: catalog.mapbox.proximity
      };

      if (seed?.pickupText) {
        const pickup = await resolvePlaceFromText(seed.pickupText, searchOpts);
        if (pickup) get().setPickup(pickup);
      }
      if (seed?.dropoffText) {
        const dropoff = await resolvePlaceFromText(seed.dropoffText, {
          country: catalog.mapbox.country,
          proximity: get().pickup?.coordinate ?? catalog.mapbox.proximity
        });
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

  setScheduledReturnAt(date) {
    set({ scheduledReturnAt: date });
  },

  setTripType(tripType) {
    set({
      tripType,
      itinerary: tripType === "hourly" ? "oneWay" : get().itinerary,
      scheduledReturnAt: tripType === "hourly" ? null : get().scheduledReturnAt,
      quote: null
    });
    void get().refreshRouteAndQuote();
  },

  setItinerary(itinerary) {
    set({
      itinerary,
      tripType: "transfer",
      scheduledReturnAt: itinerary === "oneWay" ? null : get().scheduledReturnAt
    });
  },

  setHourlyHours(hours) {
    set({ hourlyHours: Math.max(1, hours), quote: null });
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

  setSmallLuggage(count) {
    set({ smallLuggage: Math.max(0, count), quote: null });
    const bookable = get().bookableVehicleClasses();
    const selected = get().selectedVehicleClassId;
    if (selected && !bookable.some((row) => row.id === selected)) {
      set({ selectedVehicleClassId: bookable[0]?.id ?? null, selectedAddonIds: [] });
    }
    void get().refreshRouteAndQuote();
  },

  setLargeLuggage(count) {
    set({ largeLuggage: Math.max(0, count), quote: null });
    const bookable = get().bookableVehicleClasses();
    const selected = get().selectedVehicleClassId;
    if (selected && !bookable.some((row) => row.id === selected)) {
      set({ selectedVehicleClassId: bookable[0]?.id ?? null, selectedAddonIds: [] });
    }
    void get().refreshRouteAndQuote();
  },

  canProceedFromEstimate() {
    const state = get();
    return Boolean(state.quote && state.selectedVehicleClassId && state.pickup && state.dropoff);
  },

  canProceedFromDetails() {
    const state = get();
    if (!state.canProceedFromEstimate()) return false;
    if (!(state.scheduledPickupAt instanceof Date) || Number.isNaN(state.scheduledPickupAt.getTime())) {
      return false;
    }
    if (state.tripType === "hourly" && state.hourlyHours < 1) return false;
    if (state.itinerary === "return") {
      if (!(state.scheduledReturnAt instanceof Date) || Number.isNaN(state.scheduledReturnAt.getTime())) {
        return false;
      }
      if (state.scheduledReturnAt.getTime() <= state.scheduledPickupAt.getTime()) return false;
    }
    return state.passengers >= 1;
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

      const tripType = get().tripType;
      const passengers = get().passengers;
      const smallLuggage = get().smallLuggage;
      const largeLuggage = get().largeLuggage;

      const [route, catalog] = await Promise.all([
        fetchDrivingRoute(pickup.coordinate, dropoff.coordinate),
        getBookingCatalog({
          branchId,
          tripType,
          passengers,
          smallLuggage,
          largeLuggage
        })
      ]);

      const vehicleClasses = catalog.vehicleClasses;
      const bookable = filterEligibleVehicleClasses(vehicleClasses, {
        tripType,
        passengers,
        smallLuggage,
        largeLuggage
      });

      let selectedVehicleClassId = get().selectedVehicleClassId;
      if (!selectedVehicleClassId || !bookable.some((row) => row.id === selectedVehicleClassId)) {
        selectedVehicleClassId = bookable[0]?.id ?? null;
      }

      const availableAddons = filterAddonsForSelection(
        catalog.addons,
        tripType,
        selectedVehicleClassId
      );

      const selectedAddonIds = get().selectedAddonIds.filter((id) =>
        availableAddons.some((addon) => addon.id === id)
      );

      set({
        branchId,
        branches: catalog.branches.length > 0 ? catalog.branches : get().branches,
        mapboxCountry: catalog.mapbox.country ?? get().mapboxCountry,
        mapboxProximity: catalog.mapbox.proximity ?? get().mapboxProximity,
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
        tripType,
        vehicleClassId: selectedVehicleClassId,
        pickup: pickup.coordinate,
        dropoff: dropoff.coordinate,
        pickupAddressLine: pickup.addressLine,
        dropoffAddressLine: dropoff.addressLine,
        scheduledPickupAt: get().scheduledPickupAt,
        bookedHours: tripType === "hourly" ? get().hourlyHours : null,
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
