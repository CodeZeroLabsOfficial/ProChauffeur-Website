"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerSession } from "@/lib/auth/use-customer-session";
import { fetchCustomerUser } from "@/lib/dashboard/customer-user";
import type { User } from "@/lib/models/user";

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
    return <p className="text-muted-foreground text-sm">Loading account…</p>;
  }

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="text-muted-foreground">Email</p>
          <p className="font-medium">{profile?.email || email || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Display name</p>
          <p className="font-medium">{profile?.profile.displayName || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Phone</p>
          <p className="font-medium">{profile?.profile.phoneNumber || "—"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
