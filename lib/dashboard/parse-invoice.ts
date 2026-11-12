import type { DocumentData } from "firebase/firestore";

import { asDate, asDateRequired } from "@/lib/firebase/timestamps";
import { INVOICE_STATUSES, type InvoiceStatus } from "@/lib/models/enums";
import type { Invoice, InvoiceLineItem } from "@/lib/models/invoice";

function asInvoiceStatus(value: unknown): InvoiceStatus {
  return INVOICE_STATUSES.includes(value as InvoiceStatus) ? (value as InvoiceStatus) : "draft";
}

function asLineItems(raw: unknown): InvoiceLineItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === "string" ? row.id : "";
      const label = typeof row.label === "string" ? row.label : "";
      if (!id || !label) return null;
      return { id, label, amount: Number(row.amount) || 0 };
    })
    .filter((item): item is InvoiceLineItem => item != null);
}

export function parseInvoice(
  id: string,
  data: DocumentData,
  branchId?: string | null
): Invoice {
  return {
    id,
    invoiceNumber: typeof data.invoiceNumber === "string" ? data.invoiceNumber : id,
    customerID: typeof data.customerID === "string" ? data.customerID : "",
    customerName: typeof data.customerName === "string" ? data.customerName : "",
    tripIDs: Array.isArray(data.tripIDs)
      ? data.tripIDs.filter((item): item is string => typeof item === "string")
      : [],
    branchId:
      typeof data.branchId === "string"
        ? data.branchId
        : typeof branchId === "string"
          ? branchId
          : null,
    status: asInvoiceStatus(data.status),
    currencyCode: typeof data.currencyCode === "string" ? data.currencyCode : "AUD",
    lineItems: asLineItems(data.lineItems),
    subtotal: Number(data.subtotal) || 0,
    taxRate: Number(data.taxRate) || 0,
    taxAmount: Number(data.taxAmount) || 0,
    total: Number(data.total) || 0,
    issuedAt: asDateRequired(data.issuedAt, asDateRequired(data.createdAt)),
    dueAt: asDate(data.dueAt),
    paidAt: asDate(data.paidAt),
    corporateAccountId:
      typeof data.corporateAccountId === "string" ? data.corporateAccountId : null,
    stripeHostedInvoiceUrl:
      typeof data.stripeHostedInvoiceUrl === "string" ? data.stripeHostedInvoiceUrl : null,
    createdAt: asDateRequired(data.createdAt),
    updatedAt: asDateRequired(data.updatedAt, asDateRequired(data.createdAt))
  };
}
