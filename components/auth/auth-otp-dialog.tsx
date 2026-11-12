"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  AuthOtpError,
  requestAuthOtp,
  verifyAuthOtpAndSignIn
} from "@/lib/auth/auth-otp";
import { cn } from "@/lib/utils";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

function otpSlotClassName(invalid: boolean) {
  return cn(
    "size-11 rounded-xl border-0 bg-muted text-base first:rounded-xl first:border-0 last:rounded-xl",
    "data-[active=true]:z-10 data-[active=true]:border-0 data-[active=true]:ring-2 data-[active=true]:ring-foreground data-[active=true]:ring-offset-0",
    "data-[active=true]:aria-invalid:ring-destructive",
    invalid && "bg-destructive/10 ring-2 ring-destructive ring-offset-0"
  );
}

export function AuthOtpDialog({
  open,
  email,
  challengeId: initialChallengeId,
  onSuccess,
  onDismiss
}: {
  open: boolean;
  email: string;
  challengeId: string;
  onSuccess: () => void;
  onDismiss: () => void;
}) {
  const [otpCode, setOtpCode] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [otpInvalid, setOtpInvalid] = useState(false);
  const [otpShake, setOtpShake] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const verifyingRef = useRef(false);
  const shakeTimerRef = useRef<number | null>(null);
  const hydratedForOpenRef = useRef(false);

  function flashOtpInvalid() {
    setOtpInvalid(true);
    setOtpShake(false);
    window.requestAnimationFrame(() => setOtpShake(true));
    if (shakeTimerRef.current != null) window.clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = window.setTimeout(() => {
      setOtpShake(false);
      shakeTimerRef.current = null;
    }, 350);
  }

  function resetLocalState() {
    setOtpCode("");
    setChallengeId("");
    setVerifying(false);
    setResending(false);
    setOtpInvalid(false);
    setOtpShake(false);
    setResendCooldown(0);
    verifyingRef.current = false;
    hydratedForOpenRef.current = false;
    if (shakeTimerRef.current != null) {
      window.clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = null;
    }
  }

  useEffect(() => {
    if (!open || resendCooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setResendCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [open, resendCooldown]);

  useEffect(() => {
    if (!open) {
      resetLocalState();
      return;
    }
    if (hydratedForOpenRef.current) return;
    hydratedForOpenRef.current = true;
    const id = initialChallengeId.trim();
    setChallengeId(id);
    setOtpCode("");
    setOtpInvalid(false);
    setResendCooldown(id ? RESEND_COOLDOWN_SECONDS : 0);
  }, [open, initialChallengeId]);

  async function onVerifyOtp(code?: string) {
    const value = (code ?? otpCode).trim();
    if (value.length < OTP_LENGTH || !challengeId) return;
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setVerifying(true);
    setOtpInvalid(false);
    try {
      await verifyAuthOtpAndSignIn(challengeId, value);
      onSuccess();
    } catch (error) {
      setOtpCode("");
      flashOtpInvalid();
      toast.error(
        error instanceof AuthOtpError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Could not verify this code."
      );
      verifyingRef.current = false;
      setVerifying(false);
    }
  }

  async function onResendOtp() {
    if (resendCooldown > 0 || resending || verifying) return;
    setResending(true);
    setOtpInvalid(false);
    try {
      const { challengeId: id } = await requestAuthOtp(email);
      setChallengeId(id);
      setOtpCode("");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      toast.error(
        error instanceof AuthOtpError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Could not resend verification code."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !verifying) onDismiss();
      }}>
      <DialogContent className="overflow-hidden sm:max-w-md" showCloseButton={!verifying}>
        <DialogHeader className="text-left">
          <DialogTitle>Security verification</DialogTitle>
          <DialogDescription>
            Enter the 6-digit code we sent to {email.trim() || "your email"}.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-1">
          <div className={cn(otpShake && "animate-otp-shake")}>
            <InputOTP
              maxLength={OTP_LENGTH}
              value={otpCode}
              onChange={(value) => {
                setOtpCode(value);
                if (otpInvalid) setOtpInvalid(false);
                if (value.length === OTP_LENGTH && !verifyingRef.current) {
                  void onVerifyOtp(value);
                }
              }}
              disabled={verifying}
              containerClassName="justify-center">
              <InputOTPGroup className="gap-2.5 rounded-none has-aria-invalid:border-0 has-aria-invalid:ring-0">
                {Array.from({ length: OTP_LENGTH }, (_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    aria-invalid={otpInvalid}
                    className={otpSlotClassName(otpInvalid)}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          {resendCooldown > 0 ? (
            <p className="text-muted-foreground w-full text-center text-sm">
              Didn&apos;t receive a code? {resendCooldown}s
            </p>
          ) : (
            <button
              type="button"
              className="text-primary w-full text-center text-sm font-medium hover:underline disabled:pointer-events-none disabled:opacity-50"
              disabled={verifying || resending}
              onClick={() => void onResendOtp()}>
              {resending ? "Sending…" : "Resend"}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
