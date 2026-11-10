"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useBookingStore } from "@/lib/booking/booking-store";

type GuardLevel = "estimate" | "details";

/**
 * Redirects to an earlier step when booking state is incomplete.
 * Returns true once the current step is allowed.
 */
export function useBookingGuard(level: GuardLevel): boolean {
  const router = useRouter();
  const ready = useBookingStore((s) => s.ready);
  const bootstrap = useBookingStore((s) => s.bootstrap);
  const estimateOk = useBookingStore((s) => s.canProceedFromEstimate());
  const detailsOk = useBookingStore((s) => s.canProceedFromDetails());
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!ready) void bootstrap();
  }, [ready, bootstrap]);

  useEffect(() => {
    if (!ready) return;
    if (level === "estimate") {
      if (!estimateOk) {
        router.replace("/booking");
        return;
      }
      setAllowed(true);
      return;
    }
    if (!estimateOk) {
      router.replace("/booking");
      return;
    }
    if (!detailsOk) {
      router.replace("/booking/details");
      return;
    }
    setAllowed(true);
  }, [ready, level, estimateOk, detailsOk, router]);

  return allowed;
}
