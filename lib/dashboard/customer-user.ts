"use client";

import { doc, getDoc } from "firebase/firestore";

import { asDateRequired } from "@/lib/firebase/timestamps";
import { firestore } from "@/lib/firebase/client";
import type { UserRole } from "@/lib/models/enums";
import type { User } from "@/lib/models/user";

export async function fetchCustomerUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(firestore(), "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  const profile =
    data.profile && typeof data.profile === "object"
      ? (data.profile as Record<string, unknown>)
      : {};
  return {
    id: snap.id,
    role: (typeof data.role === "string" ? data.role : "customer") as UserRole,
    email: typeof data.email === "string" ? data.email : "",
    profile: {
      displayName:
        typeof profile.displayName === "string" ? profile.displayName : "",
      firstName: typeof profile.firstName === "string" ? profile.firstName : null,
      lastName: typeof profile.lastName === "string" ? profile.lastName : null,
      phoneNumber: typeof profile.phoneNumber === "string" ? profile.phoneNumber : null,
      photoURL: typeof profile.photoURL === "string" ? profile.photoURL : null
    },
    stripeCustomerId:
      typeof data.stripeCustomerId === "string" ? data.stripeCustomerId : null,
    corporateAccountId:
      typeof data.corporateAccountId === "string" ? data.corporateAccountId : null,
    preferredPaymentMethod:
      data.preferredPaymentMethod === "card" || data.preferredPaymentMethod === "corporate"
        ? data.preferredPaymentMethod
        : null,
    createdAt: asDateRequired(data.createdAt)
  };
}
