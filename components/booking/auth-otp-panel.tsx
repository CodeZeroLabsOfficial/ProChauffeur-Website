"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AuthOtpError,
  requestAuthOtp,
  verifyAuthOtpAndSignIn
} from "@/lib/booking/auth-otp";

type AuthOtpPanelProps = {
  onVerified: () => void;
};

export function AuthOtpPanel({ onVerified }: AuthOtpPanelProps) {
  const [email, setEmail] = useState("");
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  async function handleSendCode() {
    setError(null);
    setBusy(true);
    try {
      const result = await requestAuthOtp(email);
      setChallengeId(result.challengeId);
      setCooldown(30);
      const timer = window.setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            window.clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(err instanceof AuthOtpError ? err.message : "Could not send verification code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!challengeId) return;
    setError(null);
    setBusy(true);
    try {
      await verifyAuthOtpAndSignIn(challengeId, code);
      onVerified();
    } catch (err) {
      setError(err instanceof AuthOtpError ? err.message : "Could not verify this code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-border space-y-4 border p-5">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">Sign in to continue</h2>
        <p className="text-muted-foreground text-sm">
          Enter your email to create an account or sign in before payment.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="otp-email">Email</Label>
        <Input
          id="otp-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          disabled={Boolean(challengeId) || busy}
        />
      </div>

      {challengeId ? (
        <div className="space-y-2">
          <Label htmlFor="otp-code">Verification code</Label>
          <Input
            id="otp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="6-digit code"
            disabled={busy}
          />
        </div>
      ) : null}

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="flex flex-wrap gap-2">
        {!challengeId ? (
          <Button type="button" disabled={busy || !email.trim()} onClick={() => void handleSendCode()}>
            {busy ? "Sending…" : "Send code"}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              disabled={busy || code.length < 6}
              onClick={() => void handleVerify()}>
              {busy ? "Verifying…" : "Verify and continue"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || cooldown > 0}
              onClick={() => void handleSendCode()}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setChallengeId(null);
                setCode("");
                setError(null);
              }}>
              Change email
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
