import { getMapboxToken } from "@/lib/env";
import type { AddressSearchOptions } from "@/lib/mapbox/geocode";
import type { CoordinateField } from "@/lib/models/coordinate";

export type SearchBoxSuggestion = {
  mapboxId: string;
  name: string;
  namePreferred: string | null;
  featureType: string;
  fullAddress: string | null;
  placeFormatted: string;
  poiCategory: string[] | null;
};

export type SearchBoxRetrieveResult = {
  id: string;
  addressLine: string;
  coordinate: CoordinateField;
  postcode: string;
  isAirport: boolean;
  isHotel: boolean;
};

const LANDMARK_TERMS = [
  "airport",
  "terminal",
  "domestic",
  "international",
  "hotel",
  "motel",
  "resort",
  "stadium",
  "arena",
  "station",
  "port",
  "cruise",
  "hospital",
  "university"
];

type SearchBoxContextLayer = {
  name?: string;
  country_code?: string;
  region_code?: string;
  region_code_full?: string;
  address_number?: string;
  street_name?: string;
};

type SearchBoxContext = {
  country?: SearchBoxContextLayer;
  region?: SearchBoxContextLayer;
  postcode?: SearchBoxContextLayer;
  place?: SearchBoxContextLayer;
  locality?: SearchBoxContextLayer;
  address?: SearchBoxContextLayer;
  street?: SearchBoxContextLayer;
};

type SuggestItem = {
  mapbox_id: string;
  name: string;
  name_preferred?: string;
  feature_type: string;
  full_address?: string;
  place_formatted: string;
  poi_category?: string[];
};

type RetrieveFeature = {
  geometry?: { coordinates?: number[] };
  properties: {
    mapbox_id?: string;
    name: string;
    name_preferred?: string;
    feature_type: string;
    address?: string;
    full_address?: string;
    place_formatted?: string;
    poi_category?: string[];
    context?: SearchBoxContext;
    coordinates?: { latitude?: number; longitude?: number };
  };
};

/** True when the query looks like an airport, hotel, or other landmark. */
export function landmarkIntent(query: string): boolean {
  const lower = query.toLowerCase();
  return LANDMARK_TERMS.some((term) => lower.includes(term));
}

export function searchBoxDisplayName(
  suggestion: Pick<SearchBoxSuggestion, "name" | "namePreferred">
): string {
  const preferred = suggestion.namePreferred?.trim() ?? "";
  return preferred || suggestion.name;
}

export function searchBoxAddressLine(suggestion: SearchBoxSuggestion): string {
  return formatSearchBoxLine(
    searchBoxDisplayName(suggestion),
    suggestion.placeFormatted,
    suggestion.fullAddress,
    suggestion.featureType === "poi"
  );
}

function formatSearchBoxLine(
  name: string,
  placeFormatted: string,
  fullAddress: string | null | undefined,
  isPoi: boolean
): string {
  const place = placeFormatted.trim();
  if (isPoi) {
    if (!place || place.localeCompare(name, undefined, { sensitivity: "accent" }) === 0) {
      return name;
    }
    return `${name}, ${place}`;
  }
  const full = fullAddress?.trim() ?? "";
  if (full) return full;
  if (!place) return name;
  return `${name}, ${place}`;
}

function categoriesInclude(
  categories: string[] | null | undefined,
  needle: string
): boolean {
  return categories?.some((category) => category.toLowerCase().includes(needle)) === true;
}

export async function fetchSearchBoxSuggestions(
  query: string,
  sessionToken: string,
  options?: AddressSearchOptions
): Promise<SearchBoxSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const token = getMapboxToken();
  const url = new URL("https://api.mapbox.com/search/searchbox/v1/suggest");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("session_token", sessionToken);
  url.searchParams.set("access_token", token);
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", String(options?.limit ?? 4));
  url.searchParams.set("types", "poi");

  const country = options?.country?.trim();
  if (country) {
    url.searchParams.set("country", country.toLowerCase());
  }

  const proximity = options?.proximity;
  if (
    proximity &&
    Number.isFinite(proximity.longitude) &&
    Number.isFinite(proximity.latitude)
  ) {
    url.searchParams.set("proximity", `${proximity.longitude},${proximity.latitude}`);
  }

  const response = await fetch(url.toString());
  if (!response.ok) return [];

  const data = (await response.json()) as { suggestions?: SuggestItem[] };
  return (data.suggestions ?? []).flatMap((item) => {
    if (item.feature_type === "category") return [];
    return [
      {
        mapboxId: item.mapbox_id,
        name: item.name,
        namePreferred: item.name_preferred?.trim() || null,
        featureType: item.feature_type,
        fullAddress: item.full_address?.trim() || null,
        placeFormatted: item.place_formatted,
        poiCategory: item.poi_category ?? null
      }
    ];
  });
}

export async function retrieveSearchBoxFeature(
  mapboxId: string,
  sessionToken: string
): Promise<SearchBoxRetrieveResult> {
  const token = getMapboxToken();
  const url = new URL(
    `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}`
  );
  url.searchParams.set("session_token", sessionToken);
  url.searchParams.set("access_token", token);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error("Could not resolve this place.");
  }

  const data = (await response.json()) as { features?: RetrieveFeature[] };
  const feature = data.features?.[0];
  if (!feature) {
    throw new Error("Could not resolve this place.");
  }

  const props = feature.properties;
  const fromProps = props.coordinates;
  const fromGeometry = feature.geometry?.coordinates;
  const longitude = fromProps?.longitude ?? fromGeometry?.[0];
  const latitude = fromProps?.latitude ?? fromGeometry?.[1];
  if (
    longitude == null ||
    latitude == null ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude)
  ) {
    throw new Error("Could not resolve this place.");
  }

  const displayName = searchBoxDisplayName({
    name: props.name,
    namePreferred: props.name_preferred?.trim() || null
  });
  const placeFormatted = props.place_formatted?.trim() ?? "";
  const addressLine = formatSearchBoxLine(
    displayName,
    placeFormatted,
    props.full_address,
    props.feature_type === "poi"
  );
  const postcode = props.context?.postcode?.name?.trim() ?? "";
  const categories = props.poi_category ?? null;

  return {
    id: `searchbox:${props.mapbox_id ?? mapboxId}`,
    addressLine,
    coordinate: { latitude, longitude },
    postcode,
    isAirport: categoriesInclude(categories, "airport"),
    isHotel: categoriesInclude(categories, "hotel")
  };
}

export function isAirportSuggestion(suggestion: SearchBoxSuggestion): boolean {
  return categoriesInclude(suggestion.poiCategory, "airport");
}

export function isHotelSuggestion(suggestion: SearchBoxSuggestion): boolean {
  return categoriesInclude(suggestion.poiCategory, "hotel");
}
