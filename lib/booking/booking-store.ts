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
  catalogAddons: PricingAddon[];

  route: RouteEstimate | null;
  isRouting: boolean;
  quote: QuoteResult | null;
  /** Per-class quotes (no add-ons) for cards and instant class switching. */
  classQuotes: Record<string, QuoteResult>;
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
  refreshSelectedQuote: () => Promise<void>;
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

function reselectVehicleIfNeeded(
  get: () => BookingStore,
  set: (partial: Partial<BookingStore>) => void
) {
  const bookable = get().bookableVehicleClasses();
  const selected = get().selectedVehicleClassId;
  if (selected && !bookable.some((row) => row.id === selected)) {
    set({ selectedVehicleClassId: bookable[0]?.id ?? null, selectedAddonIds: [] });
  }
}

const emptyQuoteState = {
  route: null,
  quote: null,
  classQuotes: {} as Record<string, QuoteResult>,
  branchId: null,
  vehicleClasses: [] as VehicleClass[],
  availableAddons: [] as PricingAddon[],
  catalogAddons: [] as PricingAddon[],
  isPickupOutsideServiceArea: false,
  isRouting: false,
  isQuoting: false
};

let quoteRequestSeq = 0;
let selectedQuoteSeq = 0;

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
  catalogAddons: [],

  route: null,
  isRouting: false,
  quote: null,
  classQuotes: {},
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
    set({ pickup: place, quoteError: null });
    void get().refreshRouteAndQuote();
  },

  setDropoff(place) {
    set({ dropoff: place, quoteError: null });
    void get().refreshRouteAndQuote();
  },

  setScheduledPickupAt(date) {
    set({ scheduledPickupAt: date });
    void get().refreshRouteAndQuote();
  },

  setScheduledReturnAt(date) {
    set({ scheduledReturnAt: date });
  },

  setTripType(tripType) {
    set({
      tripType,
      itinerary: tripType === "hourly" ? "oneWay" : get().itinerary,
      scheduledReturnAt: tripType === "hourly" ? null : get().scheduledReturnAt
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
    set({ hourlyHours: Math.max(1, hours) });
    void get().refreshRouteAndQuote();
  },

  setPassengers(count) {
    set({ passengers: Math.max(1, count) });
    reselectVehicleIfNeeded(get, set);
    void get().refreshRouteAndQuote();
  },

  setSmallLuggage(count) {
    set({ smallLuggage: Math.max(0, count) });
    reselectVehicleIfNeeded(get, set);
    void get().refreshRouteAndQuote();
  },

  setLargeLuggage(count) {
    set({ largeLuggage: Math.max(0, count) });
    reselectVehicleIfNeeded(get, set);
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
    const state = get();
    if (state.selectedVehicleClassId === id) return;

    const availableAddons = filterAddonsForSelection(
      state.catalogAddons,
      state.tripType,
      id
    );
    const cached = state.classQuotes[id] ?? null;
    set({
      selectedVehicleClassId: id,
      selectedAddonIds: [],
      availableAddons,
      quote: cached ?? state.quote
    });
  },

  toggleAddon(id) {
    const current = get().selectedAddonIds;
    const next = current.includes(id) ? current.filter((row) => row !== id) : [...current, id];
    set({ selectedAddonIds: next });
    void get().refreshSelectedQuote();
  },

  async refreshSelectedQuote() {
    const state = get();
    const pickup = state.pickup;
    const dropoff = state.dropoff;
    const vehicleClassId = state.selectedVehicleClassId;
    const branchId = state.branchId;
    if (!pickup || !dropoff || !vehicleClassId || !branchId) return;

    const requestId = ++selectedQuoteSeq;
    set({ isQuoting: true, quoteError: null });

    try {
      if (state.selectedAddonIds.length === 0) {
        const cached = state.classQuotes[vehicleClassId] ?? null;
        if (requestId !== selectedQuoteSeq) return;
        set({ quote: cached, isQuoting: false, quoteError: null });
        return;
      }

      const quote = await buildTripQuoteRemote({
        branchId,
        tripType: state.tripType,
        vehicleClassId,
        pickup: pickup.coordinate,
        dropoff: dropoff.coordinate,
        pickupAddressLine: pickup.addressLine,
        dropoffAddressLine: dropoff.addressLine,
        scheduledPickupAt: state.scheduledPickupAt,
        bookedHours: state.tripType === "hourly" ? state.hourlyHours : null,
        addonIds: state.selectedAddonIds
      });
      if (requestId !== selectedQuoteSeq) return;
      set({ quote, isQuoting: false, quoteError: null });
    } catch (error) {
      if (requestId !== selectedQuoteSeq) return;
      const message = error instanceof Error ? error.message : "Could not update the estimate.";
      set({ isQuoting: false, quoteError: message });
    }
  },

  async refreshRouteAndQuote() {
    const state = get();
    const pickup = state.pickup;
    const dropoff = state.dropoff;

    if (!pickup || !dropoff) {
      quoteRequestSeq += 1;
      selectedQuoteSeq += 1;
      set({
        ...emptyQuoteState,
        pricingNotice: null,
        quoteError: null
      });
      return;
    }

    const requestId = ++quoteRequestSeq;
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
          if (requestId !== quoteRequestSeq) return;
          set({
            ...emptyQuoteState,
            isPickupOutsideServiceArea: error.kind === "out_of_area",
            pricingNotice: error.message,
            quoteError: null
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

      if (requestId !== quoteRequestSeq) return;

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
        catalogAddons: catalog.addons,
        selectedAddonIds,
        route,
        isPickupOutsideServiceArea: false,
        isRouting: false
      });

      if (!selectedVehicleClassId || bookable.length === 0) {
        set({
          quote: null,
          classQuotes: {},
          pricingNotice: "No vehicle classes are available for this trip.",
          isQuoting: false
        });
        return;
      }

      set({ isQuoting: true });
      const scheduledPickupAt = get().scheduledPickupAt;
      const bookedHours = tripType === "hourly" ? get().hourlyHours : null;
      const quoteBase = {
        branchId,
        tripType,
        pickup: pickup.coordinate,
        dropoff: dropoff.coordinate,
        pickupAddressLine: pickup.addressLine,
        dropoffAddressLine: dropoff.addressLine,
        scheduledPickupAt,
        bookedHours
      } as const;

      const quoted = await Promise.all(
        bookable.map(async (vehicleClass) => {
          const result = await buildTripQuoteRemote({
            ...quoteBase,
            vehicleClassId: vehicleClass.id,
            addonIds: []
          });
          return { vehicleClassId: vehicleClass.id, quote: result };
        })
      );

      if (requestId !== quoteRequestSeq) return;

      const classQuotes: Record<string, QuoteResult> = {};
      for (const row of quoted) {
        classQuotes[row.vehicleClassId] = row.quote;
      }

      let selectedQuote = classQuotes[selectedVehicleClassId] ?? null;
      if (selectedAddonIds.length > 0) {
        selectedQuote = await buildTripQuoteRemote({
          ...quoteBase,
          vehicleClassId: selectedVehicleClassId,
          addonIds: selectedAddonIds
        });
        if (requestId !== quoteRequestSeq) return;
      }

      set({
        quote: selectedQuote,
        classQuotes,
        isQuoting: false,
        quoteError: null,
        pricingNotice: null
      });
    } catch (error) {
      if (requestId !== quoteRequestSeq) return;
      const message = error instanceof Error ? error.message : "Could not update the estimate.";
      set({
        isRouting: false,
        isQuoting: false,
        quoteError: message
      });
    }
  }
}));
