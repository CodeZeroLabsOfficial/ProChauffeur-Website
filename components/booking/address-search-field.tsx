"use client";

import { useEffect, useState } from "react";

import type { SelectedPlace } from "@/lib/booking/booking-store";
import { searchAddresses, type GeocodeSuggestion } from "@/lib/mapbox/geocode";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type AddressSearchFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: SelectedPlace | null;
  onSelect: (place: SelectedPlace | null) => void;
  /** Fires on every keystroke so parents can seed free-text before a suggestion is chosen. */
  onQueryChange?: (query: string) => void;
  /** `hero` matches the marketing strip (light-on-dark). */
  variant?: "default" | "hero";
  className?: string;
};

export function AddressSearchField({
  id,
  label,
  placeholder,
  value,
  onSelect,
  onQueryChange,
  variant = "default",
  className
}: AddressSearchFieldProps) {
  const [query, setQuery] = useState(value?.addressLine ?? "");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const isHero = variant === "hero";

  useEffect(() => {
    setQuery(value?.addressLine ?? "");
  }, [value?.addressLine]);

  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    if (value?.addressLine && query.trim() === value.addressLine.trim()) {
      setSuggestions([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const rows = await searchAddresses(query);
          setSuggestions(rows);
          setSearchError(null);
          setOpen(true);
        } catch (error) {
          setSuggestions([]);
          setSearchError(error instanceof Error ? error.message : "Search failed.");
        }
      })();
    }, 280);
    return () => window.clearTimeout(handle);
  }, [query, value?.addressLine]);

  return (
    <div className={cn("relative", isHero ? "min-w-0" : "space-y-2", className)}>
      <Label
        htmlFor={id}
        className={cn(isHero && "text-xs font-medium text-white/70")}>
        {label}
      </Label>
      <Input
        id={id}
        value={query}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          onQueryChange?.(next);
          setOpen(true);
          if (!next.trim()) {
            onSelect(null);
            return;
          }
          if (value && next.trim() !== value.addressLine.trim()) {
            onSelect(null);
          }
        }}
        className={
          isHero
            ? "h-auto border-0 bg-transparent px-0 py-1 text-sm font-medium text-white shadow-none placeholder:text-white/45 focus-visible:ring-0 dark:bg-transparent"
            : undefined
        }
      />
      {searchError ? (
        <p className={cn("text-xs", isHero ? "text-red-300" : "text-destructive")}>
          {searchError}
        </p>
      ) : null}
      {open && suggestions.length > 0 ? (
        <ul
          className={cn(
            "absolute z-30 mt-1 max-h-56 w-full overflow-auto border shadow-lg",
            isHero
              ? "border-white/10 bg-neutral-950/95 text-white backdrop-blur-xl"
              : "border-border bg-popover"
          )}>
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm transition-colors",
                  isHero ? "hover:bg-white/10" : "hover:bg-muted"
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect({
                    addressLine: suggestion.addressLine,
                    coordinate: suggestion.coordinate,
                    postcode: suggestion.postcode
                  });
                  setQuery(suggestion.addressLine);
                  onQueryChange?.(suggestion.addressLine);
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
