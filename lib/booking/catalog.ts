"use client";

import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import { mapBranch, mapPricingConfig, mapVehicleClass } from "@/lib/booking/mappers";
import { firestore } from "@/lib/firebase/client";
import { unionMapboxCountryCodes } from "@/lib/mapbox/operating-country-codes";
import type { Branch } from "@/lib/models/branch";
import type { CoordinateField } from "@/lib/models/coordinate";
import type { PricingConfig } from "@/lib/models/pricing";
import type { VehicleClass } from "@/lib/models/vehicle-class";

export type OperatingMapboxContext = {
  /** Comma-joined ISO country codes from Location locales, or null if none configured. */
  country: string | null;
  /** Average service-area center across active Locations, when available. */
  proximity: CoordinateField | null;
};

export async function fetchBranches(): Promise<Branch[]> {
  const snap = await getDocs(collection(firestore(), "branches"));
  return snap.docs.map((row) => mapBranch(row.id, row.data()));
}

export async function fetchVehicleClasses(branchId: string): Promise<VehicleClass[]> {
  const snap = await getDocs(collection(firestore(), "branches", branchId, "vehicle_classes"));
  return snap.docs.map((row) => mapVehicleClass(row.id, row.data()));
}

export async function fetchPricingConfig(branchId: string): Promise<PricingConfig | null> {
  const snap = await getDoc(doc(firestore(), "branches", branchId, "settings", "pricing"));
  if (!snap.exists()) return null;
  return mapPricingConfig(snap.data());
}

function proximityFromBranches(branches: Branch[]): CoordinateField | null {
  const centers: CoordinateField[] = [];
  for (const branch of branches) {
    if (!branch.isActive) continue;
    const area = branch.serviceArea;
    if (!area || area.type !== "radius") continue;
    if (typeof area.centerLatitude !== "number" || typeof area.centerLongitude !== "number") {
      continue;
    }
    if (!Number.isFinite(area.centerLatitude) || !Number.isFinite(area.centerLongitude)) {
      continue;
    }
    centers.push({
      latitude: area.centerLatitude,
      longitude: area.centerLongitude
    });
  }
  if (centers.length === 0) return null;
  const latitude = centers.reduce((sum, row) => sum + row.latitude, 0) / centers.length;
  const longitude = centers.reduce((sum, row) => sum + row.longitude, 0) / centers.length;
  return { latitude, longitude };
}

/** Locale country codes + service-area proximity from configured Locations. */
export async function fetchOperatingMapboxContext(
  branches: Branch[]
): Promise<OperatingMapboxContext> {
  const active = branches.filter((branch) => branch.isActive);
  const locales = await Promise.all(
    active.map(async (branch) => {
      const snap = await getDoc(doc(firestore(), "branches", branch.id, "settings", "locale"));
      if (!snap.exists()) return null;
      const mapboxCountryCodes = snap.get("mapboxCountryCodes");
      return typeof mapboxCountryCodes === "string"
        ? { mapboxCountryCodes }
        : null;
    })
  );

  const country = unionMapboxCountryCodes(locales).trim() || null;
  return {
    country,
    proximity: proximityFromBranches(active)
  };
}
