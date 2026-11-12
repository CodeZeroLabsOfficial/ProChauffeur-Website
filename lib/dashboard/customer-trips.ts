"use client";

import {
  collectionGroup,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe
} from "firebase/firestore";

import { parseTrip } from "@/lib/dashboard/parse-trip";
import { firestore } from "@/lib/firebase/client";
import { canCancelTrip, type Trip } from "@/lib/models/trip";

function branchIdFromPath(path: string): string | null {
  const parts = path.split("/");
  const idx = parts.indexOf("branches");
  if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  return null;
}

export function listenCustomerTrips(
  customerId: string,
  onChange: (trips: Trip[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collectionGroup(firestore(), "trips"),
    where("customerID", "==", customerId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      const trips = snap.docs.map((row) =>
        parseTrip(row.id, row.data(), branchIdFromPath(row.ref.path))
      );
      onChange(trips);
    },
    (error) => onError?.(error)
  );
}

export async function cancelCustomerTrip(trip: Trip): Promise<void> {
  if (!canCancelTrip(trip)) {
    throw new Error("This booking can’t be cancelled.");
  }
  const branchId = trip.branchId?.trim();
  if (!branchId) {
    throw new Error("This booking is missing a Location.");
  }
  await updateDoc(doc(firestore(), "branches", branchId, "trips", trip.id), {
    status: "cancelled",
    updatedAt: serverTimestamp()
  });
}
