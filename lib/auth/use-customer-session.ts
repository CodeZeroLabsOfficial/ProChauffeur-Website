"use client";

import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { useEffect, useState } from "react";

import { isEmailAuthenticatedUser } from "@/lib/booking/auth-otp";
import { ensureAnonymousAuth } from "@/lib/firebase/ensure-anonymous";
import { firebaseAuth } from "@/lib/firebase/client";

export type CustomerSession = {
  ready: boolean;
  user: User | null;
  isCustomer: boolean;
  email: string | null;
};

export function useCustomerSession(): CustomerSession {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth(), (next) => {
      setUser(next);
      setReady(true);
    });
    return () => unsub();
  }, []);

  const isCustomer = isEmailAuthenticatedUser(user);
  return {
    ready,
    user,
    isCustomer,
    email: user?.email?.trim() || null
  };
}

export async function signOutCustomer(): Promise<void> {
  await signOut(firebaseAuth());
  await ensureAnonymousAuth();
}
