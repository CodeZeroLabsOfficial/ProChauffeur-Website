"use client";

import { signInAnonymously, type User } from "firebase/auth";

import { firebaseAuth } from "@/lib/firebase/client";

/** Ensures an Auth session exists for catalog reads and retail quotes. */
export async function ensureAnonymousAuth(): Promise<User> {
  const auth = firebaseAuth();
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}
