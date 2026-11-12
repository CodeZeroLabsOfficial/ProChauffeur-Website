"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGridIcon, LogOutIcon, UserRoundIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { signOutCustomer, useCustomerSession } from "@/lib/auth/use-customer-session";
import { fetchCustomerUser } from "@/lib/dashboard/customer-user";
import { cn, generateAvatarFallback } from "@/lib/utils";

type AccountMenuProps = {
  className?: string;
};

export function AccountMenu({ className }: AccountMenuProps) {
  const { user, email } = useCustomerSession();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState<string | undefined>();

  useEffect(() => {
    if (!user?.uid) {
      setDisplayName("");
      setPhotoURL(undefined);
      return;
    }
    let cancelled = false;
    fetchCustomerUser(user.uid).then((profile) => {
      if (cancelled) return;
      setDisplayName(profile?.profile.displayName?.trim() || "");
      setPhotoURL(profile?.profile.photoURL?.trim() || undefined);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const name = displayName || email?.trim() || "Account";
  const secondary = email?.trim() || "";
  const initials = generateAvatarFallback(name);

  async function handleSignOut() {
    await signOutCustomer();
    router.push("/");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}>
          <Avatar className="size-8 ring-2 ring-white/20">
            <AvatarImage src={photoURL} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-3 px-1.5 py-2 text-left text-sm">
            <Avatar className="size-9">
              <AvatarImage src={photoURL} alt={name} />
              <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-semibold">{name}</span>
              {secondary ? (
                <span className="text-muted-foreground truncate text-xs">{secondary}</span>
              ) : null}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild className="cursor-pointer gap-2">
            <Link href="/dashboard/settings/account">
              <UserRoundIcon className="text-muted-foreground size-4" />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-2">
            <Link href="/dashboard/trips">
              <LayoutGridIcon className="text-muted-foreground size-4" />
              My Trips
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => void handleSignOut()}>
          <LogOutIcon className="text-muted-foreground size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
