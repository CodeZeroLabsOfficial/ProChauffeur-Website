"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCardIcon, PaletteIcon, UserIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const sidebarNavItems = [
  {
    title: "Account",
    href: "/dashboard/settings/account",
    icon: UserIcon
  },
  {
    title: "Billing",
    href: "/dashboard/settings/billing",
    icon: CreditCardIcon
  },
  {
    title: "Appearance",
    href: "/dashboard/settings/appearance",
    icon: PaletteIcon
  }
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <Card className="w-full py-0">
      <CardContent className="p-2">
        <nav className="flex flex-col space-y-0.5 space-x-2 lg:space-x-0">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "hover:bg-muted justify-start",
                  active ? "bg-muted hover:bg-muted" : ""
                )}>
                <Icon />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}
