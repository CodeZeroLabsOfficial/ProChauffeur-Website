"use client";

import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";

import { getMapboxToken } from "@/lib/env";
import type { CoordinateField } from "@/lib/models/coordinate";
import type { RouteLineGeometry } from "@/lib/mapbox/directions";

type RouteMapProps = {
  pickup: CoordinateField | null;
  dropoff: CoordinateField | null;
  geometry: RouteLineGeometry | null;
};

export function RouteMap({ pickup, dropoff, geometry }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = getMapboxToken();
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [151.2093, -33.8688],
      zoom: 10,
      attributionControl: false
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      const sourceId = "booking-route";
      const layerId = "booking-route-line";

      if (geometry) {
        const data = {
          type: "Feature" as const,
          properties: {},
          geometry
        };
        const existing = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
        if (existing) {
          existing.setData(data);
        } else if (!map.getLayer(layerId)) {
          map.addSource(sourceId, { type: "geojson", data });
          map.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": "#171717",
              "line-width": 3
            }
          });
        }
        const bounds = new mapboxgl.LngLatBounds();
        geometry.coordinates.forEach((coord) => bounds.extend(coord));
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 48, duration: 600 });
        }
      }

      if (pickup) {
        markersRef.current.push(
          new mapboxgl.Marker({ color: "#171717" })
            .setLngLat([pickup.longitude, pickup.latitude])
            .addTo(map)
        );
      }
      if (dropoff) {
        markersRef.current.push(
          new mapboxgl.Marker({ color: "#737373" })
            .setLngLat([dropoff.longitude, dropoff.latitude])
            .addTo(map)
        );
      }
    };

    if (map.isStyleLoaded()) {
      apply();
    } else {
      map.once("load", apply);
    }
  }, [pickup, dropoff, geometry]);

  return <div ref={containerRef} className="border-border h-56 w-full border sm:h-72" />;
}
