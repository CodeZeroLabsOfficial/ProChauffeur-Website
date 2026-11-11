"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/marketing/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/#services" },
  { label: "Fleet", href: "/#fleet" },
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
        // Solid until the hero bottom reaches the sticky nav (h-16).
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

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 flex h-16 w-full items-center gap-3 border-b px-4 text-white transition-[background-color,backdrop-filter,border-color] duration-300 lg:px-6",
        isGlass
          ? "border-white/10 bg-neutral-950/85 backdrop-blur-md"
          : "border-white/10 bg-neutral-950 backdrop-blur-none",
        className
      )}>
      <BrandMark className="relative z-10" priority />

      {hasCenter ? (
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center px-4 sm:px-6">
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
        <div className="flex shrink-0 items-center justify-end gap-2">
          {showSignIn ? (
            <Link href="/booking" className={cn(navLinkClassName, "hidden md:inline-flex")}>
              Sign in
              <SignInIcon />
            </Link>
          ) : null}

          {!hasCenter ? (
            <Drawer
              swipeDirection="right"
              open={isOpen}
              onOpenChange={(open) => setIsOpen(open)}>
              <DrawerTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "text-white hover:bg-white/10 hover:text-white md:hidden"
                )}>
                <Menu />
                <span className="sr-only">Toggle menu</span>
              </DrawerTrigger>
              <DrawerContent className="flex flex-col border-neutral-800 bg-neutral-950 p-6 text-white">
                <DrawerTitle className="sr-only">Menu</DrawerTitle>
                <BrandMark />
                <div className="flex grow flex-col">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className="py-2 font-medium text-white"
                      onClick={() => setIsOpen(false)}>
                      {link.label}
                    </Link>
                  ))}
                </div>
                {showSignIn ? (
                  <Link
                    href="/booking"
                    className={cn(navLinkClassName, "py-2")}
                    onClick={() => setIsOpen(false)}>
                    Sign in
                    <SignInIcon />
                  </Link>
                ) : null}
              </DrawerContent>
            </Drawer>
          ) : showSignIn ? (
            <Link href="/booking" className={cn(navLinkClassName, "md:hidden")}>
              Sign in
              <SignInIcon />
            </Link>
          ) : null}
        </div>
      )}
    </nav>
  );
}
