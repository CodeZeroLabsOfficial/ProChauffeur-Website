import type { BookableServiceType } from "@/lib/models/enums";
import type { VehicleClass } from "@/lib/models/vehicle-class";

export type BookingRequirements = {
  serviceType: BookableServiceType;
  passengers: number;
  smallLuggage: number;
  largeLuggage: number;
};

export function vehicleClassMeetsCapacity(
  vehicleClass: VehicleClass,
  req: BookingRequirements
): boolean {
  const { passengerCount, luggage } = vehicleClass.capacity;
  return (
    req.passengers <= passengerCount &&
    req.smallLuggage <= luggage.smallCount &&
    req.largeLuggage <= luggage.largeCount
  );
}

export function filterEligibleVehicleClasses(
  classes: VehicleClass[],
  requirements: BookingRequirements
): VehicleClass[] {
  return classes
    .filter((vehicleClass) => {
      if (!vehicleClass.isEnabled) return false;
      if (!vehicleClass.isVisible) return false;
      if (!(vehicleClass.supportedServiceTypes ?? []).includes(requirements.serviceType)) {
        return false;
      }
      if (!vehicleClassMeetsCapacity(vehicleClass, requirements)) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.displayName.localeCompare(b.displayName);
    });
}
