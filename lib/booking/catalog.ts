"use client";

import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import { mapBranch, mapPricingConfig, mapVehicleClass } from "@/lib/booking/mappers";
import { firestore } from "@/lib/firebase/client";
import type { Branch } from "@/lib/models/branch";
import type { PricingConfig } from "@/lib/models/pricing";
import type { VehicleClass } from "@/lib/models/vehicle-class";

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
