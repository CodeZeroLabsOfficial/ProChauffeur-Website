"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerSession } from "@/lib/auth/use-customer-session";
import { fetchCustomerUser } from "@/lib/dashboard/customer-user";
import type { User } from "@/lib/models/user";

function AccountField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="text-base font-medium break-words">{value}</p>
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
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-base font-semibold">Account Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
      <Card>
        <CardContent className="py-6">
          <p className="text-destructive text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-base font-semibold">Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <AccountField label="Email" value={profile?.email || email || "—"} />
        <AccountField
          label="Display name"
          value={profile?.profile.displayName?.trim() || "—"}
        />
        <AccountField
          label="Phone"
          value={profile?.profile.phoneNumber?.trim() || "—"}
        />
      </CardContent>
    </Card>
  );
}
