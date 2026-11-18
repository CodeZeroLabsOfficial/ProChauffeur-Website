"use client";

import { useEffect, useRef, useState } from "react";

import {
  StripePaymentForm,
  type StripePaymentConfirmHandle
} from "@/components/booking/stripe-payment-form";
import { listenSavedCards } from "@/lib/dashboard/saved-cards";
import type { SavedPaymentMethod } from "@/lib/models/saved-payment-method";
import { cn } from "@/lib/utils";

export type PaymentSelection =
  | { mode: "saved"; paymentMethodId: string }
  | { mode: "new" };

type BookingPaymentPanelProps = {
  uid: string;
  clientSecret: string | null;
  isPreparingCard: boolean;
  saveCard: boolean;
  onSaveCardChange: (save: boolean) => void;
  selection: PaymentSelection;
  onSelectionChange: (selection: PaymentSelection) => void;
  paymentFormRef: React.RefObject<StripePaymentConfirmHandle | null>;
  onPaymentError: (message: string) => void;
};

function selectionClass(selected: boolean) {
  return cn(
    "w-full rounded-lg border-2 bg-background text-left text-sm transition-colors",
    selected ? "border-foreground" : "border-border hover:bg-muted"
  );
}

export function BookingPaymentPanel({
  uid,
  clientSecret,
  isPreparingCard,
  saveCard,
  onSaveCardChange,
  selection,
  onSelectionChange,
  paymentFormRef,
  onPaymentError
}: BookingPaymentPanelProps) {
  const [cards, setCards] = useState<SavedPaymentMethod[]>([]);
  const [cardsReady, setCardsReady] = useState(false);
  const didSeedSelection = useRef(false);

  useEffect(() => {
    return listenSavedCards(
      uid,
      (next) => {
        setCards(next);
        setCardsReady(true);
      },
      () => {
        setCards([]);
        setCardsReady(true);
      }
    );
  }, [uid]);

  useEffect(() => {
    if (!cardsReady || didSeedSelection.current) return;
    didSeedSelection.current = true;
    if (cards.length === 0) return;
    const preferred = cards.find((card) => card.isDefault) ?? cards[0];
    if (preferred) {
      onSelectionChange({ mode: "saved", paymentMethodId: preferred.stripePaymentMethodId });
    }
    // Seed default saved card once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, cardsReady]);

  const newSelected = selection.mode === "new";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">Confirm your trip</h2>
        <p className="text-muted-foreground text-sm text-balance">
          Choose how you will pay. Amounts are estimates until booking confirms.
        </p>
      </div>

      <section className="space-y-3">
        <h3 className="text-lg font-medium">Payment</h3>
        {!cardsReady ? (
          <p className="text-muted-foreground text-sm">Loading saved cards…</p>
        ) : (
          <div className="space-y-2">
            {cards.map((card) => {
              const selected =
                selection.mode === "saved" &&
                selection.paymentMethodId === card.stripePaymentMethodId;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() =>
                    onSelectionChange({
                      mode: "saved",
                      paymentMethodId: card.stripePaymentMethodId
                    })
                  }
                  className={cn(selectionClass(selected), "px-4 py-3")}>
                  <p className="font-medium">{card.displayLabel}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                    {card.isDefault ? " · Default" : ""}
                  </p>
                </button>
              );
            })}

            <div className={cn(selectionClass(newSelected), "overflow-hidden")}>
              <button
                type="button"
                onClick={() => onSelectionChange({ mode: "new" })}
                className="w-full px-4 py-3 text-left">
                <p className="font-medium">Pay with a new card</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Visa, Mastercard, and other cards accepted at confirmation.
                </p>
              </button>

              {newSelected ? (
                <div className="border-border space-y-4 border-t px-4 py-4">
                  <h4 className="text-sm font-medium">Card details</h4>
                  {clientSecret ? (
                    <>
                      <StripePaymentForm
                        ref={paymentFormRef}
                        clientSecret={clientSecret}
                        onError={onPaymentError}
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(event) => onSaveCardChange(event.target.checked)}
                          className="size-4"
                        />
                        <span>Save this card for next time</span>
                      </label>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {isPreparingCard
                        ? "Preparing card form…"
                        : "Could not load card form. Try selecting this option again."}
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
