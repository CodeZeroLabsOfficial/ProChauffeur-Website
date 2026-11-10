import type { TripType } from "@/lib/models/enums";

export type VehicleClassLuggageCapacity = {
  smallCount: number;
  largeCount: number;
};

export type VehicleClassCapacity = {
  passengerCount: number;
  luggage: VehicleClassLuggageCapacity;
};

export type VehicleClassInclusion = {
  id: string;
  label: string;
  value: string;
};

export type VehicleClass = {
  id: string;
  slug: string;
  displayName: string;
  sortOrder: number;
  serviceTier: string;
  bodyType: string;
  capacity: VehicleClassCapacity;
  inclusions: VehicleClassInclusion[];
  description?: string | null;
  imageUrl?: string | null;
  isEnabled: boolean;
  isVisible: boolean;
  supportedTripTypes: TripType[];
};
