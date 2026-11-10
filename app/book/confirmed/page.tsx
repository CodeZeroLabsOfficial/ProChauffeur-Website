import { Suspense } from "react";

import { ConfirmedView } from "@/components/booking/confirmed-view";

export default function BookConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex min-h-full items-center justify-center text-sm">
          Loading…
        </div>
      }>
      <ConfirmedView />
    </Suspense>
  );
}
