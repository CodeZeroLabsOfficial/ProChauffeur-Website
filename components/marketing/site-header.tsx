"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

import { BrandMark } from "@/components/marketing/brand-mark";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Fleet", href: "/#fleet" },
  { label: "Business", href: "/business" },
  { label: "Contact", href: "/contact" }
] as const;

const navLinkClassName =
  "inline-flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-white/70";

function SignInIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-4 place-items-center rounded-[3px] border border-current",
        className
      )}
      aria-hidden="true">
      <svg viewBox="0 0 12 12" className="size-2.5" fill="none">
        <path
          d="M2.5 6h7M6.5 3.5 9.5 6l-3 2.5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

type SiteHeaderProps = {
  className?: string;
  /** Replaces marketing nav links (e.g. booking trip fields). */
  center?: ReactNode;
  showSignIn?: boolean;
  /** Solid at top, glass after scroll. Disable on booking chrome. */
  scrollGlass?: boolean;
};

export function SiteHeader({
  className,
  center,
  showSignIn = true,
  scrollGlass = true
}: SiteHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGlass, setIsGlass] = useState(false);
  const hasCenter = center != null;

  useEffect(() => {
    if (!scrollGlass) {
      setIsGlass(false);
      return;
    }

    const update = () => {
      const hero = document.getElementById("hero");
      if (hero) {
        setIsGlass(hero.getBoundingClientRect().bottom <= 64);
        return;
      }
      setIsGlass(window.scrollY > 24);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [scrollGlass]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b text-white transition-[background-color,backdrop-filter,border-color] duration-300",
        isOpen || !isGlass
          ? "border-white/10 bg-neutral-950 backdrop-blur-none"
          : "border-white/10 bg-neutral-950/85 backdrop-blur-md",
        className
      )}>
      <nav className="relative z-20 flex h-16 w-full items-center gap-3 px-4 lg:px-6">
        <BrandMark className="relative z-10" priority />

        {hasCenter ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex h-16 items-center justify-center px-4 sm:px-6">
            <div className="pointer-events-auto min-w-0 max-w-full">{center}</div>
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className={navLinkClassName}>
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {(showSignIn || !hasCenter) && (
          <div className="relative z-10 ml-auto flex shrink-0 items-center justify-end gap-2">
            {showSignIn ? (
              <Link href="/booking" className={cn(navLinkClassName, "hidden md:inline-flex")}>
                Sign in
                <SignInIcon />
              </Link>
            ) : null}

            {!hasCenter ? (
              <button
                type="button"
                className="flex size-10 items-center justify-center md:hidden"
                aria-expanded={isOpen}
                aria-controls="mobile-nav-menu"
                aria-label={isOpen ? "Close menu" : "Open menu"}
                onClick={() => setIsOpen((open) => !open)}>
                <span className="relative block h-10 w-8" aria-hidden>
                  <span
                    className={cn(
                      "absolute top-1/2 left-1/2 h-[1.5px] w-5 bg-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      isOpen
                        ? "-translate-x-1/2 -translate-y-1/2 rotate-45"
                        : "-translate-x-1/2 -translate-y-[4.5px]"
                    )}
                  />
                  <span
                    className={cn(
                      "absolute top-1/2 left-1/2 h-[1.5px] w-5 bg-white transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      isOpen
                        ? "-translate-x-1/2 -translate-y-1/2 -rotate-45"
                        : "-translate-x-1/2 translate-y-[3px]"
                    )}
                  />
                </span>
              </button>
            ) : showSignIn ? (
              <Link href="/booking" className={cn(navLinkClassName, "md:hidden")}>
                Sign in
                <SignInIcon />
              </Link>
            ) : null}
          </div>
        )}
      </nav>

      {!hasCenter ? (
        <div
          id="mobile-nav-menu"
          className={cn(
            "absolute inset-x-0 top-full z-10 grid border-b border-white/10 bg-neutral-950 md:hidden",
            "transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-transparent"
          )}>
          <div className="overflow-hidden">
            <div className="flex flex-col gap-1 px-4 pt-4 pb-8">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-heading py-2 text-2xl font-medium tracking-tight text-white transition-opacity hover:opacity-60"
                  onClick={() => setIsOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
