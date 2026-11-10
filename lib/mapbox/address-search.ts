import {
  fetchGeocodeSuggestions,
  type AddressSearchOptions,
  type GeocodeSuggestion
} from "@/lib/mapbox/geocode";
import {
  fetchSearchBoxSuggestions,
  isAirportSuggestion,
  isHotelSuggestion,
  landmarkIntent,
  retrieveSearchBoxFeature,
  searchBoxAddressLine,
  searchBoxDisplayName,
  type SearchBoxSuggestion
} from "@/lib/mapbox/search-box";
import type { CoordinateField } from "@/lib/models/coordinate";

const MAX_ROWS = 8;
const MAX_SEARCH_BOX = 4;

export type AddressSearchHit =
  | {
      kind: "geocoding";
      id: string;
      title: string;
      addressLine: string;
      coordinate: CoordinateField;
      postcode: string;
      isAirport: false;
      isHotel: false;
    }
  | {
      kind: "searchBox";
      id: string;
      title: string;
      addressLine: string;
      mapboxId: string;
      isAirport: boolean;
      isHotel: boolean;
    };

export type ResolvedAddress = {
  addressLine: string;
  coordinate: CoordinateField;
  postcode: string;
};

/** Stable Search Box session id for suggest → retrieve billing. */
export function createMapboxSearchSessionToken(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Merges Geocoding results with Search Box POIs (airports, hotels, landmarks).
 * Search Box runs for landmark-intent queries and always for longer queries so
 * named hotels/airports surface without requiring the word “hotel”/“airport”.
 */
export async function searchAddresses(
  query: string,
  sessionToken: string,
  options?: AddressSearchOptions
): Promise<AddressSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const runSearchBox = landmarkIntent(trimmed) || trimmed.length >= 4;

  const geocodeTask = fetchGeocodeSuggestions(trimmed, {
    ...options,
    limit: MAX_ROWS
  }).catch(() => [] as GeocodeSuggestion[]);

  const searchBoxTask = runSearchBox
    ? fetchSearchBoxSuggestions(trimmed, sessionToken, {
        ...options,
        limit: MAX_SEARCH_BOX
      }).catch(() => [] as SearchBoxSuggestion[])
    : Promise.resolve([] as SearchBoxSuggestion[]);

  const [geocoded, searchBox] = await Promise.all([geocodeTask, searchBoxTask]);
  return mergeHits(geocoded, searchBox);
}

export async function resolveAddressHit(
  hit: AddressSearchHit,
  sessionToken: string
): Promise<ResolvedAddress> {
  if (hit.kind === "geocoding") {
    return {
      addressLine: hit.addressLine,
      coordinate: hit.coordinate,
      postcode: hit.postcode
    };
  }

  const retrieved = await retrieveSearchBoxFeature(hit.mapboxId, sessionToken);
  return {
    addressLine: retrieved.addressLine,
    coordinate: retrieved.coordinate,
    postcode: retrieved.postcode
  };
}

function mergeHits(
  geocoded: GeocodeSuggestion[],
  searchBox: SearchBoxSuggestion[]
): AddressSearchHit[] {
  const results: AddressSearchHit[] = [];
  const seenTitles = new Set<string>();
  const usedCoordinates: CoordinateField[] = [];

  function append(hit: AddressSearchHit, coordinate?: CoordinateField) {
    if (results.length >= MAX_ROWS) return;
    const titleKey = hit.title.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (seenTitles.has(titleKey)) return;
    if (
      coordinate &&
      usedCoordinates.some((existing) => coordinatesNearlyEqual(existing, coordinate))
    ) {
      return;
    }
    if (coordinate) usedCoordinates.push(coordinate);
    seenTitles.add(titleKey);
    results.push(hit);
  }

  const prioritized = [...searchBox].sort((a, b) => {
    const score = (row: SearchBoxSuggestion) =>
      (isAirportSuggestion(row) ? 2 : 0) + (isHotelSuggestion(row) ? 1 : 0);
    return score(b) - score(a);
  });

  for (const suggestion of prioritized) {
    append({
      kind: "searchBox",
      id: `searchbox:${suggestion.mapboxId}`,
      title: searchBoxDisplayName(suggestion),
      addressLine: searchBoxAddressLine(suggestion),
      mapboxId: suggestion.mapboxId,
      isAirport: isAirportSuggestion(suggestion),
      isHotel: isHotelSuggestion(suggestion)
    });
  }

  for (const suggestion of geocoded) {
    append(
      {
        kind: "geocoding",
        id: `geocode:${suggestion.id}`,
        title: suggestion.placeName.split(",")[0]?.trim() || suggestion.placeName,
        addressLine: suggestion.addressLine,
        coordinate: suggestion.coordinate,
        postcode: suggestion.postcode,
        isAirport: false,
        isHotel: false
      },
      suggestion.coordinate
    );
  }

  return results;
}

function coordinatesNearlyEqual(a: CoordinateField, b: CoordinateField): boolean {
  return (
    Math.abs(a.latitude - b.latitude) < 0.0005 &&
    Math.abs(a.longitude - b.longitude) < 0.0005
  );
}
