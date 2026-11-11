import Link from "next/link";

import { BrandMark } from "@/components/marketing/brand-mark";
import { Separator } from "@/components/ui/separator";

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-neutral-950 pt-12 pb-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 lg:px-6">
        <div className="flex flex-col items-center justify-between space-y-4 lg:flex-row lg:space-y-0">
          <BrandMark />

          <nav className="flex flex-wrap justify-center gap-4 text-sm font-medium text-white/70 [&_a]:transition-colors [&_a]:hover:text-white">
            <Link href="/#services">Services</Link>
            <Link href="/#fleet">Fleet</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/booking">Book</Link>
          </nav>
        </div>

        <Separator className="bg-white/10" />

        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} Elite Chauffeurs. All rights reserved.
          </p>

          <div className="flex gap-4">
            <Link
              href="#"
              className="text-xs text-white/50 transition-colors hover:text-white hover:underline">
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-xs text-white/50 transition-colors hover:text-white hover:underline">
              Terms of Service
            </Link>
            <Link
              href="#"
              className="text-xs text-white/50 transition-colors hover:text-white hover:underline">
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
