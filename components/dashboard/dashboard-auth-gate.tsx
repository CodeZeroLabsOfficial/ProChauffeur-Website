"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useCustomerSession } from "@/lib/auth/use-customer-session";

type DashboardAuthGateProps = {
  children: ReactNode;
};

export function DashboardAuthGate({ children }: DashboardAuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, isCustomer } = useCustomerSession();

  useEffect(() => {
    if (!ready || isCustomer) return;
    const redirect = encodeURIComponent(pathname || "/dashboard/trips");
    router.replace(`/login?redirect=${redirect}`);
  }, [ready, isCustomer, pathname, router]);

  if (!ready) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center p-8 text-sm">
        Checking sign-in…
      </div>
    );
  }

  if (!isCustomer) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center p-8 text-sm">
        Redirecting to sign in…
      </div>
    );
  }

  return <>{children}</>;
}
