"use client";

import type { ReactNode } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { useCustomerSession } from "@/lib/auth/use-customer-session";

type DashboardAuthGateProps = {
  children: ReactNode;
};

export function DashboardAuthGate({ children }: DashboardAuthGateProps) {
  const { ready, isCustomer } = useCustomerSession();

  if (!ready) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center p-8 text-sm">
        Checking sign-in…
      </div>
    );
  }

  if (!isCustomer) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center py-4 lg:min-h-[70vh]">
        <LoginForm />
      </div>
    );
  }

  return <>{children}</>;
}
