"use client";

import { httpsCallable } from "firebase/functions";

import { firebaseAuth, firebaseFunctions } from "@/lib/firebase/client";
import type { Branch } from "@/lib/models/branch";
import type { CoordinateField } from "@/lib/models/coordinate";
import type { TripType } from "@/lib/models/enums";
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
  tripType?: TripType;
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
    tripTypes?: TripType[];
    vehicleClassIds?: string[];
  }>;
};

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
      tripType: input.tripType,
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
    tripTypes: Array.isArray(addon.tripTypes) ? addon.tripTypes : [],
    vehicleClassIds: Array.isArray(addon.vehicleClassIds) ? addon.vehicleClassIds : []
  }));

  return {
    branches: Array.isArray(data.branches) ? data.branches : [],
    mapbox: {
      country: data.mapbox?.country ?? null,
      proximity: data.mapbox?.proximity ?? null
    },
    vehicleClasses: Array.isArray(data.vehicleClasses) ? data.vehicleClasses : [],
    addons
  };
}
