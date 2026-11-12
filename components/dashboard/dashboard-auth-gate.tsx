"use client";

import { useState, type ReactNode } from "react";

import { SignInDialog } from "@/components/auth/sign-in-dialog";
import { Button } from "@/components/ui/button";
import { useCustomerSession } from "@/lib/auth/use-customer-session";

type DashboardAuthGateProps = {
  children: ReactNode;
};

export function DashboardAuthGate({ children }: DashboardAuthGateProps) {
  const { ready, isCustomer } = useCustomerSession();
  const [signInOpen, setSignInOpen] = useState(true);

  if (!ready) {
    return (
      <div className="text-muted-foreground flex min-h-[50vh] items-center justify-center p-8 text-sm">
        Checking sign-in…
      </div>
    );
  }

  if (!isCustomer) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl tracking-tight">Sign in required</h1>
          <p className="text-muted-foreground text-sm">
            Sign in with your email to view trips, billing, and account settings.
          </p>
        </div>
        <Button type="button" onClick={() => setSignInOpen(true)}>
          Sign in
        </Button>
        <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} />
      </div>
    );
  }

  return <>{children}</>;
}
