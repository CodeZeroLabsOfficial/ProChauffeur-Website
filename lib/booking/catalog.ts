"use client";

import { httpsCallable } from "firebase/functions";

import { firebaseAuth, firebaseFunctions } from "@/lib/firebase/client";
import type { Branch } from "@/lib/models/branch";
import type { CoordinateField } from "@/lib/models/coordinate";
import { BOOKABLE_SERVICE_TYPES, type BookableServiceType, type ServiceType } from "@/lib/models/enums";
import type { PricingAddon } from "@/lib/models/pricing";
import type { VehicleClass } from "@/lib/models/vehicle-class";

export type OperatingMapboxContext = {
  country: string | null;
  proximity: CoordinateField | null;
};

export type BookingCatalogResult = {
  branches: Branch[];
  mapbox: OperatingMapboxContext;
  vehicleClasses: VehicleClass[];
  addons: PricingAddon[];
};

export type GetBookingCatalogInput = {
  branchId?: string | null;
  serviceType?: BookableServiceType;
  passengers?: number;
  smallLuggage?: number;
  largeLuggage?: number;
};

type RemoteCatalog = {
  branches?: Branch[];
  mapbox?: {
    country?: string | null;
    proximity?: CoordinateField | null;
  };
  vehicleClasses?: VehicleClass[];
  addons?: Array<{
    id: string;
    title: string;
    price: number;
    serviceTypes?: ServiceType[];
    vehicleClassIds?: string[];
  }>;
};

function asServiceTypes(raw: unknown): ServiceType[] {
  if (!Array.isArray(raw)) return [...BOOKABLE_SERVICE_TYPES];
  const filtered = raw.filter(
    (value): value is ServiceType =>
      value === "transfer" || value === "hourly" || value === "round_trip"
  );
  return filtered.length > 0 ? filtered : [...BOOKABLE_SERVICE_TYPES];
}

function callableErrorMessage(error: unknown, fallback: string): string {
  const message =
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
      ? (error as { message: string }).message
      : fallback;
  return message.replace(/^Firebase:\s*/i, "").replace(/\s*\([^)]*\)\s*$/, "");
}

export async function getBookingCatalog(
  input: GetBookingCatalogInput = {}
): Promise<BookingCatalogResult> {
  const user = firebaseAuth().currentUser;
  if (!user) {
    throw new Error("Sign in required to load booking catalog.");
  }

  const callable = httpsCallable<GetBookingCatalogInput, RemoteCatalog>(
    firebaseFunctions(),
    "getBookingCatalog"
  );

  let result;
  try {
    result = await callable({
      branchId: input.branchId ?? null,
      serviceType: input.serviceType,
      passengers: input.passengers,
      smallLuggage: input.smallLuggage,
      largeLuggage: input.largeLuggage
    });
  } catch (error) {
    throw new Error(callableErrorMessage(error, "Could not load booking catalog."));
  }

  const data = result.data ?? {};
  const addons: PricingAddon[] = (data.addons ?? []).map((addon) => ({
    id: addon.id,
    title: addon.title,
    price: addon.price,
    isEnabled: true,
    serviceTypes: asServiceTypes(addon.serviceTypes),
    vehicleClassIds: Array.isArray(addon.vehicleClassIds) ? addon.vehicleClassIds : []
  }));

  const vehicleClasses: VehicleClass[] = (data.vehicleClasses ?? []).map((row) => ({
    ...row,
    supportedServiceTypes: asServiceTypes(row.supportedServiceTypes)
  }));

  return {
    branches: Array.isArray(data.branches) ? data.branches : [],
    mapbox: {
      country: data.mapbox?.country ?? null,
      proximity: data.mapbox?.proximity ?? null
    },
    vehicleClasses,
    addons
  };
}
