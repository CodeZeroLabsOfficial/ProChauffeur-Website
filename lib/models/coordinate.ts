export type CoordinateField = {
  latitude: number;
  longitude: number;
};

export function hasValidCoordinate(coord: CoordinateField | null | undefined): boolean {
  if (!coord) return false;
  const { latitude, longitude } = coord;
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    (latitude !== 0 || longitude !== 0)
  );
}
