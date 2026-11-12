"use client";

import { AuthOtpPanel } from "@/components/booking/auth-otp-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

type SignInDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
};

export function SignInDialog({ open, onOpenChange, onVerified }: SignInDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader className="sr-only">
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>Sign in to your account with email verification.</DialogDescription>
        </DialogHeader>
        <AuthOtpPanel
          className="border-0 p-0"
          title="Sign in to your account"
          description="Enter your email to create an account or sign in."
          onVerified={() => {
            onVerified?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
