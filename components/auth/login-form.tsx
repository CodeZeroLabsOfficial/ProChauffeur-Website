"use client";

import { useState, type FormEvent } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { AuthOtpDialog } from "@/components/auth/auth-otp-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthOtpError, requestAuthOtp } from "@/lib/auth/auth-otp";
import { cn } from "@/lib/utils";

export type LoginFormMode = "sign-in" | "sign-up";

export function LoginForm({
  onVerified,
  initialMode = "sign-in",
  className
}: {
  onVerified?: () => void;
  initialMode?: LoginFormMode;
  className?: string;
}) {
  const [mode, setMode] = useState<LoginFormMode>(initialMode);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [challengeId, setChallengeId] = useState("");

  const isSignUp = mode === "sign-up";

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      toast.error("A valid email address is required.");
      return;
    }
    setLoading(true);
    try {
      const result = await requestAuthOtp(trimmed);
      setChallengeId(result.challengeId);
      setOtpOpen(true);
    } catch (error) {
      toast.error(
        error instanceof AuthOtpError
          ? error.message
          : "Could not send verification code."
      );
    } finally {
      setLoading(false);
    }
  }

  function finishVerified() {
    setOtpOpen(false);
    setChallengeId("");
    onVerified?.();
  }

  return (
    <>
      <Card className={cn("mx-auto w-full max-w-96", className)}>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isSignUp ? "Create New Account" : "Login"}
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Enter your email below to create your account."
              : "Enter your email below to login to your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={(event) => void onSubmit(event)}>
            <div className="grid gap-2">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading || !email.trim()}>
              {loading ? <LoaderCircleIcon className="animate-spin" /> : null}
              {isSignUp ? "Sign up" : "Login"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => setMode("sign-in")}>
                  Login
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="underline"
                  onClick={() => setMode("sign-up")}>
                  Sign up
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <AuthOtpDialog
        open={otpOpen}
        email={email}
        challengeId={challengeId}
        onSuccess={finishVerified}
        onDismiss={() => {
          setOtpOpen(false);
          setChallengeId("");
        }}
      />
    </>
  );
}
