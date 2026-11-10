/** Split a stored Mapbox `country=` value into unique lowercase ISO codes. */
export function collectMapboxCountryCodes(
  raw: string | null | undefined,
  into: Set<string>
): void {
  if (!raw) return;
  for (const part of raw.split(",")) {
    const code = part.trim().toLowerCase();
    if (!code) continue;
    into.add(code);
  }
}

/** Union of `mapboxCountryCodes` across locales → sorted comma-joined string. */
export function unionMapboxCountryCodes(
  locales: Array<{ mapboxCountryCodes?: string | null } | null | undefined>
): string {
  const codes = new Set<string>();
  for (const locale of locales) {
    collectMapboxCountryCodes(locale?.mapboxCountryCodes, codes);
  }
  return [...codes].sort().join(",");
}
