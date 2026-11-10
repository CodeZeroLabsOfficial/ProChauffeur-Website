"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
  { label: "Services", href: "/#features" },
  { label: "Fleet", href: "/fleet" },
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

function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 text-white", className)}>
      <Image
        src="/logo.png"
        alt=""
        width={32}
        height={32}
        className="size-8 rounded-md object-cover"
        priority
      />
      <span className="font-heading text-lg tracking-tight">Elite Chauffeurs</span>
    </Link>
  );
}

export function SiteHeader({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className={cn(
        "grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center border-b border-white/10 bg-neutral-950 px-4 text-white lg:px-6",
        className
      )}>
      <Logo />

      <div className="col-start-2 hidden items-center gap-8 md:flex">
        {NAV_LINKS.map((link) => (
          <Link key={link.label} href={link.href} className={navLinkClassName}>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="col-start-3 flex items-center justify-end gap-2 justify-self-end">
        <Link href="/booking" className={cn(navLinkClassName, "hidden md:inline-flex")}>
          Sign in
          <SignInIcon />
        </Link>

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
            <Logo />
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
            <Link
              href="/booking"
              className={cn(navLinkClassName, "py-2")}
              onClick={() => setIsOpen(false)}>
              Sign in
              <SignInIcon />
            </Link>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}
