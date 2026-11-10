import type { Branch } from "@/lib/models/branch";
import { hasValidCoordinate } from "@/lib/models/coordinate";

export type BranchResolveErrorKind = "missing_address" | "out_of_area";

export class BranchResolveError extends Error {
  readonly kind: BranchResolveErrorKind;

  constructor(kind: BranchResolveErrorKind) {
    super(
      kind === "missing_address"
        ? "Enter a pickup address to continue."
        : "This address is outside our service area."
    );
    this.name = "BranchResolveError";
    this.kind = kind;
  }
}

function normalizePostcode(postcode: string): string {
  return postcode.trim().toUpperCase();
}

function branchMatchesPostcode(branch: Branch, postcode: string): boolean {
  const area = branch.serviceArea;
  if (!area || area.type !== "postcodes") return false;
  const list = Array.isArray(area.postcodes) ? area.postcodes : [];
  return list.some((p) => normalizePostcode(String(p)) === postcode);
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(a));
}

function branchMatchesRadius(branch: Branch, latitude: number, longitude: number): boolean {
  const area = branch.serviceArea;
  if (!area || area.type !== "radius") return false;
  const centerLat = area.centerLatitude;
  const centerLng = area.centerLongitude;
  const radiusMeters = area.radiusMeters;
  if (
    typeof centerLat !== "number" ||
    typeof centerLng !== "number" ||
    typeof radiusMeters !== "number" ||
    radiusMeters <= 0
  ) {
    return false;
  }
  if (!hasValidCoordinate({ latitude: centerLat, longitude: centerLng })) return false;
  return haversineMeters(latitude, longitude, centerLat, centerLng) <= radiusMeters;
}

export function extractPostcodeFromAddress(line: string): string {
  const m = line.match(/\b\d{4}\b/);
  return m ? m[0] : "";
}

export function resolveBranchId(input: {
  postcode?: string;
  latitude?: number;
  longitude?: number;
  branches: Branch[];
}): string {
  const postcode = normalizePostcode(input.postcode ?? "");
  const hasCoords =
    typeof input.latitude === "number" &&
    typeof input.longitude === "number" &&
    hasValidCoordinate({ latitude: input.latitude, longitude: input.longitude });

  if (!postcode && !hasCoords) {
    throw new BranchResolveError("missing_address");
  }

  const active = input.branches
    .filter((b) => b.isActive)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  if (postcode) {
    const matches = active.filter((b) => branchMatchesPostcode(b, postcode));
    if (matches[0]) return matches[0].id;
  }

  if (hasCoords) {
    const matches = active.filter((b) =>
      branchMatchesRadius(b, input.latitude as number, input.longitude as number)
    );
    if (matches[0]) return matches[0].id;
  }

  throw new BranchResolveError("out_of_area");
}
