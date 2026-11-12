"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOutIcon, PanelLeftIcon, SettingsIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { signOutCustomer, useCustomerSession } from "@/lib/auth/use-customer-session";

export function DashboardHeader() {
  const { toggleSidebar } = useSidebar();
  const { email } = useCustomerSession();
  const router = useRouter();
  const label = email?.trim() || "Account";

  async function handleSignOut() {
    await signOutCustomer();
    router.push("/");
  }

  return (
    <header className="bg-background sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <Button type="button" variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <PanelLeftIcon />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-4" />
      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="max-w-56 truncate">
              {label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate font-normal">{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer gap-2">
              <Link href="/dashboard/settings/account">
                <SettingsIcon className="size-4" />
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => void handleSignOut()}>
              <LogOutIcon className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
