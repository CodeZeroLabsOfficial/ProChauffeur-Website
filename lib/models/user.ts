import type { UserRole } from "@/lib/models/enums";

export type UserProfile = {
  displayName: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  photoURL?: string | null;
};

/** `users/{uid}` — customer-facing fields. */
export type User = {
  id: string;
  role: UserRole;
  email: string;
  profile: UserProfile;
  stripeCustomerId?: string | null;
  corporateAccountId?: string | null;
  preferredPaymentMethod?: "card" | "corporate" | null;
  createdAt: Date;
};
