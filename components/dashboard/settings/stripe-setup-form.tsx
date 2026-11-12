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

function SetupCardInner({
  onSaved,
  onError
}: {
  onSaved: () => void;
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
      const result = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/settings/billing`
        }
      });
      if (result.error) {
        onError(result.error.message || "Could not save this card.");
        return;
      }
      onSaved();
    } catch (error) {
      onError(error instanceof Error ? error.message : "Could not save this card.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || busy}>
        {busy ? "Saving…" : "Save card"}
      </Button>
    </form>
  );
}

type StripeSetupFormProps = {
  clientSecret: string;
  onSaved: () => void;
  onError: (message: string) => void;
};

export function StripeSetupForm({ clientSecret, onSaved, onError }: StripeSetupFormProps) {
  const stripe = useMemo(() => getStripe(), []);

  if (!stripe) {
    return (
      <p className="text-destructive text-sm">
        Card vault is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable saved cards.
      </p>
    );
  }

  return (
    <Elements stripe={stripe} options={{ clientSecret }}>
      <SetupCardInner onSaved={onSaved} onError={onError} />
    </Elements>
  );
}
