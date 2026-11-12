"use client";

import { LoginForm } from "@/components/auth/login-form";
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
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-96" showCloseButton>
        <DialogHeader className="sr-only">
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription>Sign in to your account with email verification.</DialogDescription>
        </DialogHeader>
        <LoginForm
          onVerified={() => {
            onVerified?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
