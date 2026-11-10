"use client";

import { useEffect, useState } from "react";

import type { SelectedPlace } from "@/lib/booking/booking-store";
import { searchAddresses, type GeocodeSuggestion } from "@/lib/mapbox/geocode";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddressSearchFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: SelectedPlace | null;
  onSelect: (place: SelectedPlace | null) => void;
};

export function AddressSearchField({
  id,
  label,
  placeholder,
  value,
  onSelect
}: AddressSearchFieldProps) {
  const [query, setQuery] = useState(value?.addressLine ?? "");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    setQuery(value?.addressLine ?? "");
  }, [value?.addressLine]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const rows = await searchAddresses(query);
          setSuggestions(rows);
          setSearchError(null);
        } catch (error) {
          setSuggestions([]);
          setSearchError(error instanceof Error ? error.message : "Search failed.");
        }
      })();
    }, 280);
    return () => window.clearTimeout(handle);
  }, [query]);

  return (
    <div className="relative space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          if (!event.target.value.trim()) onSelect(null);
        }}
      />
      {searchError ? <p className="text-destructive text-xs">{searchError}</p> : null}
      {open && suggestions.length > 0 ? (
        <ul className="border-border bg-popover absolute z-20 mt-1 max-h-56 w-full overflow-auto border shadow-sm">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className="hover:bg-muted w-full px-3 py-2 text-left text-sm"
                onClick={() => {
                  onSelect({
                    addressLine: suggestion.addressLine,
                    coordinate: suggestion.coordinate,
                    postcode: suggestion.postcode
                  });
                  setQuery(suggestion.addressLine);
                  setOpen(false);
                  setSuggestions([]);
                }}>
                {suggestion.placeName}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
