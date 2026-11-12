import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateAvatarFallback(value: string) {
  const names = value.split(" ").filter((name) => name);
  if (!names.length) return "?";
  return names.map((name) => name.charAt(0).toUpperCase()).join("").slice(0, 2);
}
