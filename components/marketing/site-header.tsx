"use client";

import { Menu } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/fleet", label: "Fleet" },
  { href: "/contact", label: "Contact" }
] as const;

export function SiteHeader({ className }: { className?: string }) {
  return (
    <header className={cn("absolute inset-x-0 top-0 z-20", className)}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <Link
          href="/"
          className="font-heading text-lg tracking-tight text-white sm:text-xl">
          ProChauffeur
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-white/80 transition-colors hover:text-white">
              {link.label}
            </Link>
          ))}
          <Link
            href="/book"
            className={cn(
              buttonVariants({ size: "default" }),
              "bg-white text-neutral-950 hover:bg-white/90"
            )}>
            Book
          </Link>
        </div>

        <Drawer swipeDirection="right">
          <DrawerTrigger
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "text-white hover:bg-white/10 md:hidden"
            )}
            aria-label="Open menu">
            <Menu />
          </DrawerTrigger>
          <DrawerContent className="p-6">
            <DrawerHeader className="p-0">
              <DrawerTitle className="font-heading text-left text-xl font-normal">
                ProChauffeur
              </DrawerTitle>
            </DrawerHeader>
            <div className="mt-8 flex flex-col gap-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-foreground py-2 text-base">
                  {link.label}
                </Link>
              ))}
              <Link href="/book" className={cn(buttonVariants({ size: "lg" }), "mt-4 w-full")}>
                Book a trip
              </Link>
            </div>
          </DrawerContent>
        </Drawer>
      </nav>
    </header>
  );
}
