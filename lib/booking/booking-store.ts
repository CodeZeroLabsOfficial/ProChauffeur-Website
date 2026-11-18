"use client";

import { create } from "zustand";

import {
  loadBookingSession,
  saveBookingSession,
  type BookingSessionSnapshot
} from "@/lib/booking/booking-session";
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
import type { BookableServiceType } from "@/lib/models/enums";
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
  serviceType: BookableServiceType;
  itinerary: "oneWay" | "return";
  hourlyHours: number;
  passengers: number;
  adults: number;
  children: number;
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
    serviceType?: BookableServiceType;
    hourlyHours?: number;
    passengers?: number;
    adults?: number;
    children?: number;
  }) => Promise<void>;
  persistSession: () => void;
  setPickup: (place: SelectedPlace | null) => void;
  setDropoff: (place: SelectedPlace | null) => void;
  setScheduledPickupAt: (date: Date) => void;
  setScheduledReturnAt: (date: Date | null) => void;
  setServiceType: (serviceType: BookableServiceType) => void;
  setItinerary: (itinerary: "oneWay" | "return") => void;
  setHourlyHours: (hours: number) => void;
  setPassengers: (count: number) => void;
  setAdults: (count: number) => void;
  setChildren: (count: number) => void;
  setPassengerCounts: (adults: number, children: number) => void;
  setSmallLuggage: (count: number) => void;
  setLargeLuggage: (count: number) => void;
  selectVehicleClass: (id: string) => void;
  toggleAddon: (id: string) => void;
  refreshRouteAndQuote: () => Promise<void>;
  refreshSelectedQuote: () => Promise<void>;
  bookableVehicleClasses: () => VehicleClass[];
  selectedVehicleClass: () => VehicleClass | null;
  canProceedFromEstimate: () => boolean;
  canProceedToSummary: () => boolean;
};

function snapshotFromState(state: {
  pickup: SelectedPlace | null;
  dropoff: SelectedPlace | null;
  scheduledPickupAt: Date;
  scheduledReturnAt: Date | null;
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
}): BookingSessionSnapshot {
  return {
    pickup: state.pickup,
    dropoff: state.dropoff,
    scheduledPickupAt: state.scheduledPickupAt.toISOString(),
    scheduledReturnAt: state.scheduledReturnAt?.toISOString() ?? null,
    serviceType: state.serviceType,
    itinerary: state.itinerary,
    hourlyHours: state.hourlyHours,
    passengers: state.passengers,
    adults: state.adults,
    children: state.children,
    smallLuggage: state.smallLuggage,
    largeLuggage: state.largeLuggage,
    selectedVehicleClassId: state.selectedVehicleClassId,
    selectedAddonIds: state.selectedAddonIds
  };
}

function applySessionSnapshot(
  snapshot: BookingSessionSnapshot,
  set: (partial: Partial<BookingStore>) => void
) {
  const scheduledPickupAt = new Date(snapshot.scheduledPickupAt);
  if (Number.isNaN(scheduledPickupAt.getTime())) return;

  let scheduledReturnAt: Date | null = null;
  if (snapshot.scheduledReturnAt) {
    const parsed = new Date(snapshot.scheduledReturnAt);
    if (!Number.isNaN(parsed.getTime())) scheduledReturnAt = parsed;
  }

  const adults = Math.max(1, snapshot.adults || 1);
  const children = Math.max(0, snapshot.children || 0);
  set({
    pickup: snapshot.pickup,
    dropoff: snapshot.dropoff,
    scheduledPickupAt,
    scheduledReturnAt,
    serviceType: snapshot.serviceType,
    itinerary: snapshot.itinerary,
    hourlyHours: Math.max(1, snapshot.hourlyHours || 1),
    adults,
    children,
    passengers: Math.max(1, adults + children),
    smallLuggage: Math.max(0, snapshot.smallLuggage || 0),
    largeLuggage: Math.max(0, snapshot.largeLuggage || 0),
    selectedVehicleClassId: snapshot.selectedVehicleClassId,
    selectedAddonIds: Array.isArray(snapshot.selectedAddonIds) ? snapshot.selectedAddonIds : []
  });
}

function clampPassengerCounts(adults: number, children: number, maxTotal = 8) {
  const nextAdults = Math.max(1, Math.min(maxTotal, Math.floor(adults) || 1));
  const nextChildren = Math.max(0, Math.min(maxTotal - nextAdults, Math.floor(children) || 0));
  return {
    adults: nextAdults,
    children: nextChildren,
    passengers: nextAdults + nextChildren
  };
}

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
  serviceType: BookableServiceType,
  vehicleClassId: string | null
): PricingAddon[] {
  return addons.filter((addon) => {
    if (!(addon.serviceTypes ?? []).includes(serviceType)) return false;
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
  serviceType: "transfer",
  itinerary: "oneWay",
  hourlyHours: 3,
  passengers: 1,
  adults: 1,
  children: 0,
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
      serviceType: state.serviceType,
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

      const saved = loadBookingSession();
      const hasUrlSeed = Boolean(
        seed?.pickupText ||
          seed?.dropoffText ||
          seed?.scheduledPickupAt ||
          seed?.scheduledReturnAt ||
          seed?.passengers ||
          seed?.adults ||
          seed?.children
      );

      if (saved && !hasUrlSeed) {
        applySessionSnapshot(saved, set);
        if (get().pickup && get().dropoff) {
          void get().refreshRouteAndQuote();
        }
        return;
      }

      if (seed?.serviceType === "transfer" || seed?.serviceType === "hourly") {
        set({ serviceType: seed.serviceType });
      }

      if (seed?.itinerary === "return" || seed?.itinerary === "oneWay") {
        set({ itinerary: seed.itinerary });
      }

      if (typeof seed?.hourlyHours === "number" && seed.hourlyHours > 0) {
        set({ hourlyHours: seed.hourlyHours });
      }

      if (
        typeof seed?.adults === "number" ||
        typeof seed?.children === "number" ||
        (typeof seed?.passengers === "number" && seed.passengers >= 1)
      ) {
        const adults =
          typeof seed.adults === "number" && seed.adults >= 1
            ? seed.adults
            : typeof seed.passengers === "number" && seed.passengers >= 1
              ? seed.passengers
              : 1;
        const children =
          typeof seed.children === "number" && seed.children >= 0 ? seed.children : 0;
        set(clampPassengerCounts(adults, children));
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
          set({ scheduledReturnAt: parsed, itinerary: "return", serviceType: "transfer" });
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

      get().persistSession();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not start booking. Check env and Auth.";
      set({ bootError: message, ready: false });
    }
  },

  persistSession() {
    saveBookingSession(snapshotFromState(get()));
  },

  setPickup(place) {
    set({ pickup: place, quoteError: null });
    get().persistSession();
    void get().refreshRouteAndQuote();
  },

  setDropoff(place) {
    set({ dropoff: place, quoteError: null });
    get().persistSession();
    void get().refreshRouteAndQuote();
  },

  setScheduledPickupAt(date) {
    set({ scheduledPickupAt: date });
    get().persistSession();
    void get().refreshRouteAndQuote();
  },

  setScheduledReturnAt(date) {
    set({ scheduledReturnAt: date });
    get().persistSession();
  },

  setServiceType(serviceType) {
    set({
      serviceType,
      itinerary: serviceType === "hourly" ? "oneWay" : get().itinerary,
      scheduledReturnAt: serviceType === "hourly" ? null : get().scheduledReturnAt
    });
    get().persistSession();
    void get().refreshRouteAndQuote();
  },

  setItinerary(itinerary) {
    set({
      itinerary,
      serviceType: "transfer",
      scheduledReturnAt: itinerary === "oneWay" ? null : get().scheduledReturnAt
    });
    get().persistSession();
  },

  setHourlyHours(hours) {
    set({ hourlyHours: Math.max(1, hours) });
    get().persistSession();
    void get().refreshRouteAndQuote();
  },

  setPassengers(count) {
    set(clampPassengerCounts(count, 0));
    reselectVehicleIfNeeded(get, set);
    get().persistSession();
    void get().refreshRouteAndQuote();
  },

  setAdults(count) {
    set(clampPassengerCounts(count, get().children));
    reselectVehicleIfNeeded(get, set);
    get().persistSession();
    void get().refreshRouteAndQuote();
  },

  setChildren(count) {
    set(clampPassengerCounts(get().adults, count));
    reselectVehicleIfNeeded(get, set);
    get().persistSession();
    void get().refreshRouteAndQuote();
  },

  setPassengerCounts(adults, children) {
    set(clampPassengerCounts(adults, children));
    reselectVehicleIfNeeded(get, set);
    get().persistSession();
    void get().refreshRouteAndQuote();
  },

  setSmallLuggage(count) {
    set({ smallLuggage: Math.max(0, count) });
    reselectVehicleIfNeeded(get, set);
    get().persistSession();
    void get().refreshRouteAndQuote();
  },

  setLargeLuggage(count) {
    set({ largeLuggage: Math.max(0, count) });
    reselectVehicleIfNeeded(get, set);
    get().persistSession();
    void get().refreshRouteAndQuote();
  },

  canProceedFromEstimate() {
    const state = get();
    return Boolean(state.quote && state.selectedVehicleClassId && state.pickup && state.dropoff);
  },

  canProceedToSummary() {
    const state = get();
    if (!state.canProceedFromEstimate()) return false;
    if (!(state.scheduledPickupAt instanceof Date) || Number.isNaN(state.scheduledPickupAt.getTime())) {
      return false;
    }
    if (state.serviceType === "hourly" && state.hourlyHours < 1) return false;
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
      state.serviceType,
      id
    );
    const cached = state.classQuotes[id] ?? null;
    set({
      selectedVehicleClassId: id,
      selectedAddonIds: [],
      availableAddons,
      quote: cached ?? state.quote
    });
    get().persistSession();
  },

  toggleAddon(id) {
    const current = get().selectedAddonIds;
    const next = current.includes(id) ? current.filter((row) => row !== id) : [...current, id];
    set({ selectedAddonIds: next });
    get().persistSession();
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
        serviceType: state.serviceType,
        vehicleClassId,
        pickup: pickup.coordinate,
        dropoff: dropoff.coordinate,
        pickupAddressLine: pickup.addressLine,
        dropoffAddressLine: dropoff.addressLine,
        scheduledPickupAt: state.scheduledPickupAt,
        bookedHours: state.serviceType === "hourly" ? state.hourlyHours : null,
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

      const serviceType = get().serviceType;
      const passengers = get().passengers;
      const smallLuggage = get().smallLuggage;
      const largeLuggage = get().largeLuggage;

      const [route, catalog] = await Promise.all([
        fetchDrivingRoute(pickup.coordinate, dropoff.coordinate),
        getBookingCatalog({
          branchId,
          serviceType,
          passengers,
          smallLuggage,
          largeLuggage
        })
      ]);

      if (requestId !== quoteRequestSeq) return;

      const vehicleClasses = catalog.vehicleClasses;
      const bookable = filterEligibleVehicleClasses(vehicleClasses, {
        serviceType,
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
        serviceType,
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
      const bookedHours = serviceType === "hourly" ? get().hourlyHours : null;
      const quoteBase = {
        branchId,
        serviceType,
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
