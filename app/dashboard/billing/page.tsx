import { BillingDataTable } from "@/components/dashboard/billing-data-table";
import { ListPageHeader } from "@/components/dashboard/list-page-header";

export default function DashboardBillingPage() {
  return (
    <>
      <ListPageHeader title="My Billing" description="Invoices and receipts for your trips." />
      <BillingDataTable />
    </>
  );
}
