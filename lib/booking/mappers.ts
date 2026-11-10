import type { DocumentData } from "firebase/firestore";

import type { Branch, BranchServiceArea } from "@/lib/models/branch";
import type { TripType } from "@/lib/models/enums";
import type { PricingAddon, PricingConfig } from "@/lib/models/pricing";
import type { VehicleClass } from "@/lib/models/vehicle-class";

function asTripTypes(raw: unknown): TripType[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is TripType => t === "transfer" || t === "hourly");
}

export function mapBranch(id: string, data: DocumentData): Branch {
  return {
    id,
    name: typeof data.name === "string" && data.name.trim() ? data.name.trim() : id,
    isActive: data.isActive !== false,
    serviceArea: (data.serviceArea as BranchServiceArea | null | undefined) ?? null
  };
}

export function mapVehicleClass(id: string, data: DocumentData): VehicleClass {
  const capacity = data.capacity ?? {};
  const luggage = capacity.luggage ?? {};
  return {
    id,
    slug: typeof data.slug === "string" ? data.slug : id,
    displayName:
      typeof data.displayName === "string" && data.displayName.trim()
        ? data.displayName.trim()
        : id,
    sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
    serviceTier: typeof data.serviceTier === "string" ? data.serviceTier : "Business",
    bodyType: typeof data.bodyType === "string" ? data.bodyType : "Sedan",
    capacity: {
      passengerCount:
        typeof capacity.passengerCount === "number" ? capacity.passengerCount : 4,
      luggage: {
        smallCount: typeof luggage.smallCount === "number" ? luggage.smallCount : 0,
        largeCount: typeof luggage.largeCount === "number" ? luggage.largeCount : 2
      }
    },
    inclusions: Array.isArray(data.inclusions)
      ? data.inclusions
          .map((row: DocumentData, index: number) => ({
            id: typeof row.id === "string" ? row.id : `inclusion-${index}`,
            label: typeof row.label === "string" ? row.label : "",
            value: typeof row.value === "string" ? row.value : ""
          }))
          .filter((row: { label: string }) => row.label)
      : [],
    description: typeof data.description === "string" ? data.description : null,
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : null,
    isEnabled: data.isEnabled !== false,
    isVisible: data.isVisible !== false,
    supportedTripTypes: asTripTypes(data.supportedTripTypes)
  };
}

export function mapPricingConfig(data: DocumentData): PricingConfig {
  const addonsRaw = Array.isArray(data.addons) ? data.addons : [];
  const addons: PricingAddon[] = addonsRaw
    .map((row: DocumentData, index: number) => ({
      id: typeof row.id === "string" && row.id.trim() ? row.id.trim() : `addon-${index}`,
      title: typeof row.title === "string" ? row.title : "Add-on",
      price: typeof row.price === "number" ? row.price : 0,
      isEnabled: row.isEnabled !== false,
      tripTypes: asTripTypes(row.tripTypes),
      vehicleClassIds: Array.isArray(row.vehicleClassIds)
        ? row.vehicleClassIds.filter((id: unknown): id is string => typeof id === "string")
        : []
    }))
    .filter((addon: PricingAddon) => addon.isEnabled);
  return { addons };
}
