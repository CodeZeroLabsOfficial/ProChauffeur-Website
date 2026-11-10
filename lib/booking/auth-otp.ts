"use client";

import { httpsCallable } from "firebase/functions";
import { onAuthStateChanged, signInWithCustomToken, type User } from "firebase/auth";

import { firebaseAuth, firebaseFunctions } from "@/lib/firebase/client";

export class AuthOtpError extends Error {
  readonly retryAfterSeconds?: number;

  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "AuthOtpError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function callableMessage(error: unknown, fallback: string): AuthOtpError {
  if (error instanceof AuthOtpError) return error;
  const details =
    typeof error === "object" && error && "details" in error
      ? (error as { details?: { retryAfterSeconds?: number } }).details
      : undefined;
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: string }).message ?? "")
      : "";
  const cleaned = message.replace(/^Firebase:\s*/i, "").replace(/\s*\(.*\)\s*$/, "").trim();
  return new AuthOtpError(cleaned || fallback, details?.retryAfterSeconds);
}

/** Email a one-time login code. Returns challengeId. */
export async function requestAuthOtp(email: string): Promise<{ challengeId: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    throw new AuthOtpError("A valid email address is required.");
  }
  const callable = httpsCallable<{ email: string }, { challengeId?: string }>(
    firebaseFunctions(),
    "requestAuthOtp"
  );
  try {
    const result = await callable({ email: trimmed });
    const challengeId = result.data?.challengeId?.trim();
    if (!challengeId) {
      throw new AuthOtpError("Could not send verification code.");
    }
    return { challengeId };
  } catch (error) {
    throw callableMessage(error, "Could not send verification code.");
  }
}

/** Verify OTP and exchange custom token for a customer session. */
export async function verifyAuthOtpAndSignIn(
  challengeId: string,
  code: string
): Promise<User> {
  const id = challengeId.trim();
  const trimmedCode = code.trim();
  if (!id || !trimmedCode) {
    throw new AuthOtpError("Enter the verification code.");
  }
  const callable = httpsCallable<
    { challengeId: string; code: string },
    { customToken?: string; verified?: boolean }
  >(firebaseFunctions(), "verifyAuthOtp");

  let customToken: string | undefined;
  try {
    const result = await callable({ challengeId: id, code: trimmedCode });
    customToken = result.data?.customToken?.trim();
    if (!customToken) {
      throw new AuthOtpError("Could not verify this code.");
    }
  } catch (error) {
    throw callableMessage(error, "Could not verify this code.");
  }

  const credential = await signInWithCustomToken(firebaseAuth(), customToken);
  return credential.user;
}

/** True when the session is a non-anonymous signed-in customer. */
export function isEmailAuthenticatedUser(user: User | null | undefined): boolean {
  if (!user || user.isAnonymous) return false;
  return Boolean(user.email?.trim());
}

export function waitForAuthUser(): Promise<User | null> {
  const auth = firebaseAuth();
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(user);
    });
  });
}
