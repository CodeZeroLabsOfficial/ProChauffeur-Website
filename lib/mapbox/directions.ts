import { getMapboxToken } from "@/lib/env";
import type { CoordinateField } from "@/lib/models/coordinate";

export type RouteLineGeometry = {
  type: "LineString";
  coordinates: [number, number][];
};

export type RouteEstimate = {
  distanceMeters: number;
  durationSeconds: number;
  geometry: RouteLineGeometry | null;
};

type DirectionsResponse = {
  routes?: Array<{
    distance?: number;
    duration?: number;
    geometry?: RouteLineGeometry;
  }>;
};

export async function fetchDrivingRoute(
  pickup: CoordinateField,
  dropoff: CoordinateField
): Promise<RouteEstimate> {
  const token = getMapboxToken();
  const path = `${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}`;
  const params = new URLSearchParams({
    geometries: "geojson",
    overview: "full",
    access_token: token
  });
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${path}?${params}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not calculate the route.");
  }
  const data = (await response.json()) as DirectionsResponse;
  const route = data.routes?.[0];
  if (!route || typeof route.distance !== "number" || typeof route.duration !== "number") {
    throw new Error("No driving route found for these addresses.");
  }
  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    geometry: route.geometry ?? null
  };
}

export function formatDistanceKm(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDurationMinutes(seconds: number): string {
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
