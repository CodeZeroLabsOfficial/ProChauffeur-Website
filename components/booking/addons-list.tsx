"use client";

import type { PricingAddon } from "@/lib/models/pricing";
import { formatMoney } from "@/lib/booking/quote-api";

type AddonsListProps = {
  addons: PricingAddon[];
  selectedIds: string[];
  currencyCode: string;
  onToggle: (id: string) => void;
};

export function AddonsList({ addons, selectedIds, currencyCode, onToggle }: AddonsListProps) {
  if (addons.length === 0) {
    return <p className="text-muted-foreground text-sm">No add-ons available.</p>;
  }

  return (
    <ul className="space-y-3">
      {addons.map((addon) => {
        const checked = selectedIds.includes(addon.id);
        return (
          <li key={addon.id}>
            <label className="border-border flex cursor-pointer items-center justify-between gap-4 border px-4 py-3">
              <span className="flex items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(addon.id)}
                  className="size-4"
                />
                {addon.title}
              </span>
              <span className="text-muted-foreground text-sm">
                {formatMoney(addon.price, currencyCode)}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
