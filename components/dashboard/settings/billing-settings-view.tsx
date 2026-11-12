"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { StripeSetupForm } from "@/components/dashboard/settings/stripe-setup-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerSession } from "@/lib/auth/use-customer-session";
import {
  listenSavedCards,
  prepareSavedCard,
  removeSavedCard,
  setDefaultSavedCard,
  syncSavedCards,
  SavedCardsError
} from "@/lib/dashboard/saved-cards";
import type { SavedPaymentMethod } from "@/lib/models/saved-payment-method";

export function BillingSettingsView() {
  const { user, isCustomer } = useCustomerSession();
  const [cards, setCards] = useState<SavedPaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!isCustomer || !user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    return listenSavedCards(
      user.uid,
      (next) => {
        setCards(next);
        setLoading(false);
      },
      () => {
        toast.error("Could not load payment methods.");
        setLoading(false);
      }
    );
  }, [isCustomer, user?.uid]);

  async function handleAddCard() {
    try {
      const result = await prepareSavedCard();
      setClientSecret(result.clientSecret);
    } catch (error) {
      toast.error(error instanceof SavedCardsError ? error.message : "Could not start card setup.");
    }
  }

  async function handleSaved() {
    try {
      await syncSavedCards();
      setClientSecret(null);
      toast.success("Card saved.");
    } catch (error) {
      toast.error(error instanceof SavedCardsError ? error.message : "Could not sync cards.");
    }
  }

  async function handleRemove(card: SavedPaymentMethod) {
    const confirmed = window.confirm(`Remove ${card.displayLabel}?`);
    if (!confirmed) return;
    setBusyId(card.id);
    try {
      await removeSavedCard(card.stripePaymentMethodId);
      toast.success("Card removed.");
    } catch (error) {
      toast.error(error instanceof SavedCardsError ? error.message : "Could not remove card.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSetDefault(card: SavedPaymentMethod) {
    setBusyId(card.id);
    try {
      await setDefaultSavedCard(card.stripePaymentMethodId);
      toast.success("Default card updated.");
    } catch (error) {
      toast.error(error instanceof SavedCardsError ? error.message : "Could not update default card.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="font-heading text-base font-semibold">Payment methods</CardTitle>
          <Button type="button" size="sm" onClick={() => void handleAddCard()}>
            Add card
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading cards…</p>
          ) : cards.length === 0 ? (
            <p className="text-muted-foreground text-sm">No saved cards yet.</p>
          ) : (
            <ul className="space-y-2">
              {cards.map((card) => (
                <li
                  key={card.id}
                  className="border-border flex flex-col gap-2 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{card.displayLabel}</p>
                    <p className="text-muted-foreground">
                      Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                    </p>
                    {card.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!card.isDefault ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busyId === card.id}
                        onClick={() => void handleSetDefault(card)}>
                        Set default
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={busyId === card.id}
                      onClick={() => void handleRemove(card)}>
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {clientSecret ? (
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-base font-semibold">Add card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StripeSetupForm
              clientSecret={clientSecret}
              onSaved={() => void handleSaved()}
              onError={(message) => toast.error(message)}
            />
            <Button type="button" variant="ghost" onClick={() => setClientSecret(null)}>
              Cancel
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
