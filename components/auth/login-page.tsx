"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { LoginForm, type LoginFormMode } from "@/components/auth/login-form";
import { useCustomerSession } from "@/lib/auth/use-customer-session";

function safeRedirect(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, isCustomer } = useCustomerSession();
  const redirectTo = safeRedirect(searchParams.get("redirect"));
  const modeParam = searchParams.get("mode");
  const initialMode: LoginFormMode = modeParam === "sign-up" ? "sign-up" : "sign-in";

  useEffect(() => {
    if (!ready || !isCustomer) return;
    router.replace(redirectTo);
  }, [ready, isCustomer, redirectTo, router]);

  if (!ready) {
    return (
      <p className="text-muted-foreground text-center text-sm">Checking sign-in…</p>
    );
  }

  if (isCustomer) {
    return (
      <p className="text-muted-foreground text-center text-sm">Redirecting…</p>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <Link href="/" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
        Elite Chauffeurs
      </Link>
      <LoginForm
        initialMode={initialMode}
        onVerified={() => {
          router.replace(redirectTo);
          router.refresh();
        }}
      />
    </div>
  );
}

export function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-4 lg:h-screen">
      <Suspense
        fallback={
          <p className="text-muted-foreground text-center text-sm">Loading…</p>
        }>
        <LoginPageContent />
      </Suspense>
    </div>
  );
}
