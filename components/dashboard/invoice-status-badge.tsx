import { Badge } from "@/components/ui/badge";
import { invoiceStatusTitle, type InvoiceStatus } from "@/lib/models/enums";
import { cn } from "@/lib/utils";

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "border-neutral-300 bg-neutral-50 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300",
  sent: "border-blue-300 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  paid: "border-green-300 bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-300",
  void: "border-neutral-300 bg-neutral-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400",
  overdue: "border-red-300 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusStyles[status])}>
      {invoiceStatusTitle[status]}
    </Badge>
  );
}
