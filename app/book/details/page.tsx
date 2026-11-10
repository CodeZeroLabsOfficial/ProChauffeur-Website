import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BookDetailsPage() {
  return (
    <div className="bg-background flex min-h-full flex-col">
      <header className="border-border border-b px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/book" className="font-heading text-lg tracking-tight">
            ProChauffeur
          </Link>
          <Link href="/book" className={cn(buttonVariants({ variant: "ghost" }))}>
            Back
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-16 sm:px-6">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Trip details
        </p>
        <h1 className="font-heading text-4xl tracking-tight">Trip details</h1>
        <p className="text-muted-foreground max-w-xl text-lg text-balance">
          Schedule, passengers, and luggage land here in the next phase. Your fare estimate is
          preserved in booking state.
        </p>
      </main>
    </div>
  );
}
