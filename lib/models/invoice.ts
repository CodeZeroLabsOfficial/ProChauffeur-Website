import type { InvoiceStatus } from "@/lib/models/enums";

export type InvoiceLineItem = {
  id: string;
  label: string;
  amount: number;
};

/** Invoice at `branches/{branchId}/invoices/{id}`. */
export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerID: string;
  customerName: string;
  tripIDs: string[];
  branchId?: string | null;
  status: InvoiceStatus;
  currencyCode: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  issuedAt: Date;
  dueAt?: Date | null;
  paidAt?: Date | null;
  corporateAccountId?: string | null;
  stripeHostedInvoiceUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function invoiceIsCorporate(invoice: Invoice): boolean {
  return Boolean(invoice.corporateAccountId?.trim());
}
