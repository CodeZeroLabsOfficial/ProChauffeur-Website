"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { getStripePublishableKey } from "@/lib/env";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe() {
  const key = getStripePublishableKey();
  if (!key) return null;
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

type StripePaymentFormProps = {
  clientSecret: string;
  onPaid: () => void;
  onError: (message: string) => void;
};

function ConfirmPaymentInner({
  onPaid,
  onError
}: {
  onPaid: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/booking/confirmed`
        }
      });
      if (result.error) {
        onError(result.error.message || "Payment failed.");
        return;
      }
      onPaid();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Payment failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <PaymentElement />
      <Button type="submit" size="lg" className="w-full" disabled={!stripe || busy}>
        {busy ? "Processing…" : "Pay and confirm"}
      </Button>
    </form>
  );
}

export function StripePaymentForm({ clientSecret, onPaid, onError }: StripePaymentFormProps) {
  const stripe = useMemo(() => getStripe(), []);

  if (!stripe) {
    return (
      <p className="text-destructive text-sm">
        Card checkout is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payment.
      </p>
    );
  }

  return (
    <Elements stripe={stripe} options={{ clientSecret }}>
      <ConfirmPaymentInner onPaid={onPaid} onError={onError} />
    </Elements>
  );
}
