import Image from "next/image";
import Link from "next/link";

import { Separator } from "@/components/ui/separator";

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14C17.26 2.1 16.1 2 14.84 2 12.27 2 10.5 3.7 10.5 6.61V9.5H8v4h2.5V22h3.5z" />
    </svg>
  );
}

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.869L2.25 2.25h6.183l4.269 5.647L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.92A3.12 3.12 0 1 1 12 8.88a3.12 3.12 0 0 1 0 6.24zm6.288-8.16a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0zM12 3.6c-2.28 0-2.568.01-3.468.05-.9.041-1.512.184-2.048.392a4.14 4.14 0 0 0-1.496.972 4.14 4.14 0 0 0-.972 1.496c-.208.536-.351 1.148-.392 2.048C3.61 9.432 3.6 9.72 3.6 12s.01 2.568.05 3.468c.041.9.184 1.512.392 2.048a4.14 4.14 0 0 0 .972 1.496c.44.44.96.76 1.496.972.536.208 1.148.351 2.048.392.9.04 1.188.05 3.468.05s2.568-.01 3.468-.05c.9-.041 1.512-.184 2.048-.392a4.14 4.14 0 0 0 1.496-.972 4.14 4.14 0 0 0 .972-1.496c.208-.536.351-1.148.392-2.048.04-.9.05-1.188.05-3.468s-.01-2.568-.05-3.468c-.041-.9-.184-1.512-.392-2.048a4.14 4.14 0 0 0-.972-1.496 4.14 4.14 0 0 0-1.496-.972c-.536-.208-1.148-.351-2.048-.392C14.568 3.61 14.28 3.6 12 3.6zm0 1.68c2.244 0 2.508.008 3.396.048.82.037 1.264.174 1.56.288.392.152.672.334.966.628.294.294.476.574.628.966.114.296.251.74.288 1.56.04.888.048 1.152.048 3.396s-.008 2.508-.048 3.396c-.037.82-.174 1.264-.288 1.56a2.46 2.46 0 0 1-.628.966 2.46 2.46 0 0 1-.966.628c-.296.114-.74.251-1.56.288-.888.04-1.152.048-3.396.048s-2.508-.008-3.396-.048c-.82-.037-1.264-.174-1.56-.288a2.46 2.46 0 0 1-.966-.628 2.46 2.46 0 0 1-.628-.966c-.114-.296-.251-.74-.288-1.56C5.288 14.508 5.28 14.244 5.28 12s.008-2.508.048-3.396c.037-.82.174-1.264.288-1.56.152-.392.334-.672.628-.966.294-.294.574-.476.966-.628.296-.114.74-.251 1.56-.288C9.492 5.288 9.756 5.28 12 5.28z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M6.94 6.5A2.44 2.44 0 1 1 6.94 1.62a2.44 2.44 0 0 1 0 4.88zM2.75 22V8.75h4.38V22H2.75zM10.13 22h4.38v-7.16c0-1.9.36-3.74 2.71-3.74 2.32 0 2.35 2.16 2.35 3.86V22H24v-7.88c0-3.87-.83-6.84-5.35-6.84-2.17 0-3.63 1.19-4.23 2.32h-.06V8.75h-4.23c.06 1.22 0 13.25 0 13.25z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="w-full border-t border-white/10 bg-neutral-950 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 lg:px-6">
        <div className="flex flex-col items-center justify-between space-y-4 lg:flex-row lg:space-y-0">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 text-white">
            <Image
              src="/logo.png"
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-md object-cover"
            />
            <span className="font-heading text-lg tracking-tight">Elite Chauffeurs</span>
          </Link>

          <nav className="flex flex-wrap justify-center gap-4 text-sm font-medium text-white/70 [&_a]:transition-colors [&_a]:hover:text-white">
            <Link href="/#services">Services</Link>
            <Link href="/fleet">Fleet</Link>
            <Link href="/business">Business</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/booking">Book</Link>
          </nav>

          <div className="flex justify-center space-x-6 text-white/70 [&_a]:transition-colors [&_a]:hover:text-white">
            <Link href="#" aria-label="Facebook">
              <FacebookIcon className="size-4" />
            </Link>
            <Link href="#" aria-label="Twitter">
              <TwitterIcon className="size-4" />
            </Link>
            <Link href="#" aria-label="Instagram">
              <InstagramIcon className="size-4" />
            </Link>
            <Link href="#" aria-label="LinkedIn">
              <LinkedInIcon className="size-4" />
            </Link>
          </div>
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
