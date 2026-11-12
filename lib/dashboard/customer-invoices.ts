"use client";

import {
  collectionGroup,
  onSnapshot,
  orderBy,
  query,
  where,
  type Unsubscribe
} from "firebase/firestore";

import { parseInvoice } from "@/lib/dashboard/parse-invoice";
import { firestore } from "@/lib/firebase/client";
import type { Invoice } from "@/lib/models/invoice";

function branchIdFromPath(path: string): string | null {
  const parts = path.split("/");
  const idx = parts.indexOf("branches");
  if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  return null;
}

export function listenCustomerInvoices(
  customerId: string,
  onChange: (invoices: Invoice[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(
    collectionGroup(firestore(), "invoices"),
    where("customerID", "==", customerId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      const invoices = snap.docs.map((row) =>
        parseInvoice(row.id, row.data(), branchIdFromPath(row.ref.path))
      );
      onChange(invoices);
    },
    (error) => onError?.(error)
  );
}
