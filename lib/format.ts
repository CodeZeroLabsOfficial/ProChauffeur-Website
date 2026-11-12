import { format } from "date-fns";

export function formatDateTime(value: Date | null | undefined): string {
  if (!value || Number.isNaN(value.getTime())) return "—";
  return format(value, "dd MMM yyyy, HH:mm");
}

export function formatDate(value: Date | null | undefined): string {
  if (!value || Number.isNaN(value.getTime())) return "—";
  return format(value, "dd MMM yyyy");
}

export function formatMoneyAmount(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode || "AUD"
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
}

export function shortBookingId(id: string): string {
  const trimmed = id.trim();
  if (trimmed.length <= 8) return trimmed.toUpperCase();
  return trimmed.slice(-8).toUpperCase();
}
