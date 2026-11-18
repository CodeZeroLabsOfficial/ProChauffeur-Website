"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useBookingStore } from "@/lib/booking/booking-store";

type GuardLevel = "estimate" | "summary";

/** Redirects to an earlier step when booking state is incomplete. */
export function useBookingGuard(level: GuardLevel): boolean {
  const router = useRouter();
  const ready = useBookingStore((s) => s.ready);
  const bootstrap = useBookingStore((s) => s.bootstrap);
  const estimateOk = useBookingStore((s) => s.canProceedFromEstimate());
  const summaryOk = useBookingStore((s) => s.canProceedToSummary());
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
    if (!estimateOk || !summaryOk) {
      router.replace("/booking");
      return;
    }
    setAllowed(true);
  }, [ready, level, estimateOk, summaryOk, router]);

  return allowed;
}
