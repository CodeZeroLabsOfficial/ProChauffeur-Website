import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "estimate", label: "Estimate", href: "/book" },
  { id: "details", label: "Details", href: "/book/details" },
  { id: "payment", label: "Payment", href: "/book/payment" },
  { id: "summary", label: "Summary", href: "/book/summary" }
] as const;

export type BookingStepId = (typeof STEPS)[number]["id"];

type BookingChromeProps = {
  step: BookingStepId;
  backHref: string;
  children: React.ReactNode;
};

export function BookingChrome({ step, backHref, children }: BookingChromeProps) {
  const activeIndex = STEPS.findIndex((row) => row.id === step);

  return (
    <div className="bg-background flex min-h-full flex-col">
      <header className="border-border border-b px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/" className="font-heading text-lg tracking-tight">
            Elite Chauffeurs
          </Link>
          <Link href={backHref} className={cn(buttonVariants({ variant: "ghost" }))}>
            Back
          </Link>
        </div>
      </header>

      <div className="border-border border-b px-4 py-3 sm:px-6">
        <nav
          aria-label="Booking steps"
          className="text-muted-foreground mx-auto flex max-w-3xl gap-2 overflow-x-auto text-xs font-medium tracking-wide uppercase">
          {STEPS.map((row, index) => {
            const isActive = row.id === step;
            const isPast = index < activeIndex;
            return (
              <span
                key={row.id}
                className={cn(
                  "shrink-0",
                  isActive && "text-foreground",
                  isPast && "text-foreground/70"
                )}>
                {row.label}
                {index < STEPS.length - 1 ? (
                  <span className="text-muted-foreground/50 mx-2" aria-hidden>
                    /
                  </span>
                ) : null}
              </span>
            );
          })}
        </nav>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
