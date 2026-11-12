"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

import { LoginForm } from "@/components/auth/login-form";
import { BookingChrome } from "@/components/booking/booking-chrome";
import { buttonVariants } from "@/components/ui/button";
import { isEmailAuthenticatedUser } from "@/lib/auth/auth-otp";
import { useBookingStore } from "@/lib/booking/booking-store";
import { useBookingGuard } from "@/lib/booking/use-booking-guard";
import { firebaseAuth } from "@/lib/firebase/client";
import { formatMoney } from "@/lib/booking/quote-api";
import { cn } from "@/lib/utils";

export function PaymentView() {
  const router = useRouter();
  const allowed = useBookingGuard("details");
  const quote = useBookingStore((s) => s.quote);
  const bootstrap = useBookingStore((s) => s.bootstrap);
  const ready = useBookingStore((s) => s.ready);

  const [emailAuthed, setEmailAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [settlement, setSettlement] = useState<"card">("card");

  useEffect(() => {
    if (!ready) void bootstrap();
  }, [ready, bootstrap]);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), (user) => {
      setEmailAuthed(isEmailAuthenticatedUser(user));
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  if (!allowed || !authReady) {
    return (
      <BookingChrome step="payment">
        <p className="text-muted-foreground text-sm">Preparing payment…</p>
      </BookingChrome>
    );
  }

  return (
    <BookingChrome step="payment">
      <div className="pb-28">
        <div className="mb-8 space-y-2">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Payment
          </p>
          <h1 className="font-heading text-4xl tracking-tight">How will you pay?</h1>
          <p className="text-muted-foreground max-w-xl text-sm text-balance">
            Card payment is available for retail bookings. Your card is charged when you confirm.
          </p>
        </div>

        {!emailAuthed ? (
          <LoginForm
            className="mx-0"
            onVerified={() => setEmailAuthed(true)}
          />
        ) : (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Settlement</h2>
              <button
                type="button"
                onClick={() => setSettlement("card")}
                className={cn(
                  "border-border w-full border px-4 py-4 text-left transition-colors",
                  settlement === "card"
                    ? "bg-foreground text-background"
                    : "bg-background hover:bg-muted"
                )}>
                <p className="text-sm font-medium">Pay by card</p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    settlement === "card" ? "text-background/75" : "text-muted-foreground"
                  )}>
                  Visa, Mastercard, and other cards accepted at confirmation.
                </p>
              </button>
              <p className="text-muted-foreground text-xs">
                Corporate on-account settlement is available when your account is linked to a
                company. Use the mobile app or ask your account manager to link first.
              </p>
            </section>

            {quote ? (
              <p className="border-border bg-muted/40 border px-4 py-3 text-sm">
                Estimated total{" "}
                <span className="font-medium">
                  {formatMoney(quote.displayTotal, quote.currencyCode)}
                </span>
                . Final amount is confirmed when you book.
              </p>
            ) : null}
          </div>
        )}

        <div className="border-border bg-background fixed inset-x-0 bottom-0 border-t px-4 py-4">
          <div className="mx-auto flex max-w-3xl gap-3">
            <Link
              href="/booking/details"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "flex-1")}>
              Back
            </Link>
            <button
              type="button"
              disabled={!emailAuthed}
              onClick={() => router.push("/booking/summary")}
              className={cn(
                buttonVariants({ size: "lg" }),
                "flex-1",
                !emailAuthed && "opacity-45"
              )}>
              Review booking
            </button>
          </div>
        </div>
      </div>
    </BookingChrome>
  );
}
