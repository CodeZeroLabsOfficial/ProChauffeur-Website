import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MarketingCta() {
  return (
    <section className="bg-neutral-950 px-4 py-20 text-white sm:px-6 sm:py-28">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-12 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl space-y-3">
          <h2 className="font-heading text-3xl tracking-tight text-balance sm:text-4xl">
            Ready when you are
          </h2>
          <p className="text-base text-white/70 text-balance sm:text-lg">
            Start with pickup and drop-off. Choose a vehicle class, review the estimate, then
            confirm.
          </p>
        </div>
        <Link
          href="/booking"
          className={cn(
            buttonVariants({ size: "lg" }),
            "bg-white text-neutral-950 hover:bg-white/90"
          )}>
          Start booking
        </Link>
      </div>
    </section>
  );
}
