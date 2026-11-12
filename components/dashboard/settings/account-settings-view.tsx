"use client";

import { useEffect, useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerSession } from "@/lib/auth/use-customer-session";
import { fetchCustomerUser } from "@/lib/dashboard/customer-user";
import type { User } from "@/lib/models/user";

function AccountField({
  label,
  value,
  description
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-sm font-medium break-words">{value}</p>
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
    </div>
  );
}

export function AccountSettingsView() {
  const { user, isCustomer, email } = useCustomerSession();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isCustomer || !user?.uid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCustomerUser(user.uid)
      .then((next) => {
        if (!cancelled) {
          setProfile(next);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Could not load account details.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isCustomer, user?.uid]);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="space-y-8">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-5 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent>
          <p className="text-destructive text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent>
        <div className="space-y-8">
          <AccountField
            label="Email"
            value={profile?.email || email || "—"}
            description="The email address used to sign in to your account."
          />
          <AccountField
            label="Display name"
            value={profile?.profile.displayName?.trim() || "—"}
            description="This is the name that will be displayed on your profile."
          />
          <AccountField
            label="Phone"
            value={profile?.profile.phoneNumber?.trim() || "—"}
            description="Used for trip updates when provided."
          />
        </div>
      </CardContent>
    </Card>
  );
}
