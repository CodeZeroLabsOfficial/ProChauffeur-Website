"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe
} from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { getStripePublishableKey } from "@/lib/env";

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe() {
  const key = getStripePublishableKey();
  if (!key) return null;
  if (!stripePromise) stripePromise = loadStripe(key);
  return stripePromise;
}

export type StripePaymentConfirmHandle = {
  confirm: () => Promise<boolean>;
};

type StripePaymentFieldsProps = {
  onError: (message: string) => void;
  children?: ReactNode;
};

const StripePaymentFields = forwardRef<StripePaymentConfirmHandle, StripePaymentFieldsProps>(
  function StripePaymentFields({ onError, children }, ref) {
    const stripe = useStripe();
    const elements = useElements();
    const [ready, setReady] = useState(false);

    useImperativeHandle(ref, () => ({
      async confirm() {
        if (!stripe || !elements) {
          onError("Card form is not ready yet.");
          return false;
        }
        const result = await stripe.confirmPayment({
          elements,
          redirect: "if_required",
          confirmParams: {
            return_url: `${window.location.origin}/booking/confirmed`
          }
        });
        if (result.error) {
          onError(result.error.message || "Payment failed.");
          return false;
        }
        return true;
      }
    }));

    return (
      <div className="space-y-4">
        <PaymentElement onReady={() => setReady(true)} />
        {!ready ? (
          <p className="text-muted-foreground text-sm">Loading card form…</p>
        ) : null}
        {children}
      </div>
    );
  }
);

type StripePaymentFormProps = {
  clientSecret: string;
  onError: (message: string) => void;
  children?: ReactNode;
};

export const StripePaymentForm = forwardRef<StripePaymentConfirmHandle, StripePaymentFormProps>(
  function StripePaymentForm({ clientSecret, onError, children }, ref) {
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
        <StripePaymentFields ref={ref} onError={onError}>
          {children}
        </StripePaymentFields>
      </Elements>
    );
  }
);

export async function confirmSavedCardPayment(input: {
  clientSecret: string;
  paymentMethodId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const stripe = await getStripe();
  if (!stripe) {
    return { ok: false, message: "Card checkout is not configured." };
  }
  const result = await stripe.confirmPayment({
    clientSecret: input.clientSecret,
    confirmParams: {
      payment_method: input.paymentMethodId,
      return_url: `${window.location.origin}/booking/confirmed`
    },
    redirect: "if_required"
  });
  if (result.error) {
    return { ok: false, message: result.error.message || "Payment failed." };
  }
  return { ok: true };
}
