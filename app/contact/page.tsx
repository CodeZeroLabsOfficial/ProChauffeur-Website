import Link from "next/link";

import { SiteFooter } from "@/components/marketing/site-footer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ContactPage() {
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
        <h1 className="font-heading text-4xl tracking-tight">Contact</h1>
        <p className="text-muted-foreground max-w-xl text-lg text-balance">
          Contact details for this stamp will live here. Until then, book online or reach your
          operator through their published channels.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
