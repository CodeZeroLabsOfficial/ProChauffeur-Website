"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDownIcon, LogOutIcon, SettingsIcon, RouteIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { signOutCustomer } from "@/lib/auth/use-customer-session";
import { cn } from "@/lib/utils";

type AccountMenuProps = {
  email: string | null;
  className?: string;
  triggerClassName?: string;
};

export function AccountMenu({ email, className, triggerClassName }: AccountMenuProps) {
  const router = useRouter();
  const label = email?.trim() || "Account";

  async function handleSignOut() {
    await signOutCustomer();
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "inline-flex h-auto items-center gap-2 px-2 py-1.5 text-sm font-medium text-white hover:bg-white/10 hover:text-white",
            triggerClassName
          )}>
          <span className={cn("max-w-40 truncate", className)}>{label}</span>
          <ChevronDownIcon className="size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer gap-2">
          <Link href="/dashboard/trips">
            <RouteIcon className="size-4" />
            My trips
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer gap-2">
          <Link href="/dashboard/settings/account">
            <SettingsIcon className="size-4" />
            Account Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer gap-2"
          onClick={() => void handleSignOut()}>
          <LogOutIcon className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
