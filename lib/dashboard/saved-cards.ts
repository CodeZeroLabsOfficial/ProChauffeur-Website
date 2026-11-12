"use client";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type Unsubscribe
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";

import { asDateRequired } from "@/lib/firebase/timestamps";
import { firebaseAuth, firebaseFunctions, firestore } from "@/lib/firebase/client";
import type { SavedPaymentMethod } from "@/lib/models/saved-payment-method";

export class SavedCardsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SavedCardsError";
  }
}

function parseSavedCard(id: string, data: Record<string, unknown>): SavedPaymentMethod {
  return {
    id,
    stripePaymentMethodId:
      typeof data.stripePaymentMethodId === "string" ? data.stripePaymentMethodId : id,
    type: "card",
    brand: typeof data.brand === "string" ? data.brand : "card",
    last4: typeof data.last4 === "string" ? data.last4 : "••••",
    expMonth: Number(data.expMonth) || 0,
    expYear: Number(data.expYear) || 0,
    isDefault: data.isDefault === true,
    displayLabel:
      typeof data.displayLabel === "string"
        ? data.displayLabel
        : `${String(data.brand ?? "Card")} •••• ${String(data.last4 ?? "")}`,
    createdAt: asDateRequired(data.createdAt),
    updatedAt: asDateRequired(data.updatedAt, asDateRequired(data.createdAt))
  };
}

export function listenSavedCards(
  uid: string,
  onChange: (cards: SavedPaymentMethod[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collection(firestore(), "users", uid, "payment_methods"),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      onChange(snap.docs.map((row) => parseSavedCard(row.id, row.data())));
    },
    (error) => onError?.(error)
  );
}

type ManageAction = "prepare" | "sync" | "remove" | "setDefault";

async function manageSavedCards(
  action: ManageAction,
  paymentMethodId?: string
): Promise<Record<string, unknown>> {
  const user = firebaseAuth().currentUser;
  if (!user || user.isAnonymous) {
    throw new SavedCardsError("Sign in required to manage payment methods.");
  }
  const callable = httpsCallable<
    { action: ManageAction; paymentMethodId?: string },
    Record<string, unknown>
  >(firebaseFunctions(), "manageSavedCards");
  try {
    const result = await callable({
      action,
      ...(paymentMethodId ? { paymentMethodId } : {})
    });
    return result.data ?? {};
  } catch (error) {
    const message =
      typeof error === "object" && error && "message" in error
        ? String((error as { message?: string }).message ?? "")
        : "";
    throw new SavedCardsError(message || "Could not update payment methods.");
  }
}

export async function prepareSavedCard(): Promise<{ clientSecret: string }> {
  const data = await manageSavedCards("prepare");
  const clientSecret =
    typeof data.clientSecret === "string" ? data.clientSecret.trim() : "";
  if (!clientSecret) {
    throw new SavedCardsError("Could not start card setup.");
  }
  return { clientSecret };
}

export async function syncSavedCards(): Promise<void> {
  await manageSavedCards("sync");
}

export async function removeSavedCard(paymentMethodId: string): Promise<void> {
  await manageSavedCards("remove", paymentMethodId);
}

export async function setDefaultSavedCard(paymentMethodId: string): Promise<void> {
  await manageSavedCards("setDefault", paymentMethodId);
}
