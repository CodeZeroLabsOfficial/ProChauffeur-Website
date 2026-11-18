import type { ServiceType } from "@/lib/models/enums";

export type PricingAddon = {
  id: string;
  title: string;
  price: number;
  isEnabled: boolean;
  serviceTypes: ServiceType[];
  vehicleClassIds: string[];
};
