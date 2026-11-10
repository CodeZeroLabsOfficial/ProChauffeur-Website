"use client";

import Image from "next/image";

import { formatMoney } from "@/lib/booking/quote-api";
import type { VehicleClass } from "@/lib/models/vehicle-class";
import { cn } from "@/lib/utils";

type VehicleClassListProps = {
  classes: VehicleClass[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  quoteTotal?: number | null;
  currencyCode?: string;
};

export function VehicleClassList({
  classes,
  selectedId,
  onSelect,
  quoteTotal = null,
  currencyCode = "AUD"
}: VehicleClassListProps) {
  if (classes.length === 0) {
    return <p className="text-muted-foreground text-sm">No vehicle classes available yet.</p>;
  }

  return (
    <ul className="flex gap-3 overflow-x-auto pb-1">
      {classes.map((vehicleClass) => {
        const selected = vehicleClass.id === selectedId;
        return (
          <li key={vehicleClass.id} className="min-w-[220px] flex-1">
            <button
              type="button"
              onClick={() => onSelect(vehicleClass.id)}
              className={cn(
                "border-border h-full w-full border p-4 text-left transition-colors",
                selected ? "border-foreground bg-muted/40" : "hover:bg-muted/30"
              )}>
              <div className="bg-muted relative mb-3 aspect-[16/10] w-full overflow-hidden">
                {vehicleClass.imageUrl ? (
                  <Image
                    src={vehicleClass.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="220px"
                  />
                ) : null}
              </div>
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{vehicleClass.displayName}</p>
                {selected && quoteTotal != null ? (
                  <p className="text-sm font-medium tabular-nums">
                    {formatMoney(quoteTotal, currencyCode)}
                  </p>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {vehicleClass.capacity.passengerCount} passengers · {vehicleClass.bodyType}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
