import { getMapboxToken } from "@/lib/env";
import type { CoordinateField } from "@/lib/models/coordinate";

export type GeocodeSuggestion = {
  id: string;
  placeName: string;
  addressLine: string;
  coordinate: CoordinateField;
  postcode: string;
};

export type AddressSearchOptions = {
  country?: string | null;
  proximity?: CoordinateField | null;
  limit?: number;
};

type MapboxFeature = {
  id?: string;
  place_name?: string;
  text?: string;
  center?: [number, number];
  context?: Array<{ id?: string; text?: string }>;
};

function postcodeFromFeature(feature: MapboxFeature): string {
  const fromContext = feature.context?.find((c) => c.id?.startsWith("postcode."));
  if (fromContext?.text) return fromContext.text;
  const m = String(feature.place_name ?? "").match(/\b\d{4}\b/);
  return m ? m[0] : "";
}

export async function searchAddresses(
  query: string,
  options?: AddressSearchOptions
): Promise<GeocodeSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const token = getMapboxToken();
  const params = new URLSearchParams({
    access_token: token,
    autocomplete: "true",
    limit: String(options?.limit ?? 5),
    types: "address,poi,place",
    language: "en"
  });

  const country = options?.country?.trim();
  if (country) {
    params.set("country", country.toLowerCase());
  }

  const proximity = options?.proximity;
  if (
    proximity &&
    Number.isFinite(proximity.longitude) &&
    Number.isFinite(proximity.latitude)
  ) {
    params.set("proximity", `${proximity.longitude},${proximity.latitude}`);
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(trimmed)}.json?${params}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Address search failed. Try again.");
  }
  const data = (await response.json()) as { features?: MapboxFeature[] };
  const features = Array.isArray(data.features) ? data.features : [];

  return features
    .map((feature, index) => {
      const center = feature.center;
      if (!center || typeof center[0] !== "number" || typeof center[1] !== "number") {
        return null;
      }
      const placeName = feature.place_name?.trim() || feature.text?.trim() || trimmed;
      return {
        id: feature.id || `suggestion-${index}`,
        placeName,
        addressLine: placeName,
        coordinate: { longitude: center[0], latitude: center[1] },
        postcode: postcodeFromFeature(feature)
      } satisfies GeocodeSuggestion;
    })
    .filter((row): row is GeocodeSuggestion => row !== null);
}
