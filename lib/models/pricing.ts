import type { TripType } from "@/lib/models/enums";

export type PricingAddon = {
  id: string;
  title: string;
  price: number;
  isEnabled: boolean;
  tripTypes: TripType[];
  vehicleClassIds: string[];
};

export type PricingConfig = {
  addons: PricingAddon[];
};
