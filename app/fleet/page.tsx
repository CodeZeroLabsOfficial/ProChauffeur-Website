import Link from "next/link";

import { SiteFooter } from "@/components/marketing/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function FleetPage() {
  return (
    <div className="bg-background flex min-h-full flex-col">
      <header className="border-border border-b px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="font-heading text-lg tracking-tight">
            ProChauffeur
          </Link>
          <Link href="/book" className={cn(buttonVariants())}>
            Book
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-4 px-4 py-20 sm:px-6">
        <h1 className="font-heading text-4xl tracking-tight">Fleet</h1>
        <p className="text-muted-foreground max-w-xl text-lg text-balance">
          Vehicle classes for your Location will appear here. For now, start a fare estimate to see
          what is available to book.
        </p>
        <Link href="/book" className={cn(buttonVariants({ size: "lg" }), "mt-4 w-fit")}>
          Get estimate
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
