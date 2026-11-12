"use client";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import { DownloadIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import {
  DataTableFrame,
  dataTableClassName
} from "@/components/dashboard/data-table-frame";
import { DataTableSkeletonRows } from "@/components/dashboard/data-table-skeleton";
import {
  DateRangePicker,
  dateInRange,
  thisWeekRange,
  type DateRangePreset
} from "@/components/dashboard/date-range-picker";
import { InvoiceStatusBadge } from "@/components/dashboard/invoice-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useCustomerSession } from "@/lib/auth/use-customer-session";
import { listenCustomerInvoices } from "@/lib/dashboard/customer-invoices";
import { formatDate, formatMoneyAmount } from "@/lib/format";
import { INVOICE_STATUSES } from "@/lib/models/enums";
import { invoiceIsCorporate, type Invoice } from "@/lib/models/invoice";

type InvoiceRow = Invoice & {
  searchLabel: string;
  issuedLabel: string;
  amountLabel: string;
  paymentMethodLabel: "Corporate" | "Card";
  canDownloadReceipt: boolean;
};

export function BillingDataTable() {
  const { user, isCustomer } = useCustomerSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [preset, setPreset] = useState<DateRangePreset>("thisWeek");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => thisWeekRange());
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    if (!isCustomer || !user?.uid) {
      setInvoices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return listenCustomerInvoices(
      user.uid,
      (next) => {
        setInvoices(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message || "Could not load invoices.");
        setLoading(false);
      }
    );
  }, [isCustomer, user?.uid]);

  const rows = useMemo<InvoiceRow[]>(
    () =>
      invoices
        .filter((invoice) => dateInRange(invoice.issuedAt, dateRange))
        .filter((invoice) =>
          statusFilter === "all" ? true : invoice.status === statusFilter
        )
        .map((invoice) => {
          const paymentMethodLabel = invoiceIsCorporate(invoice) ? "Corporate" : "Card";
          const issuedLabel = formatDate(invoice.issuedAt);
          const amountLabel = formatMoneyAmount(invoice.total, invoice.currencyCode);
          const canDownloadReceipt = Boolean(invoice.stripeHostedInvoiceUrl?.trim());
          return {
            ...invoice,
            paymentMethodLabel,
            issuedLabel,
            amountLabel,
            canDownloadReceipt,
            searchLabel: [invoice.invoiceNumber, amountLabel, paymentMethodLabel, issuedLabel]
              .join(" ")
              .toLowerCase()
          };
        }),
    [invoices, dateRange, statusFilter]
  );

  const columns = useMemo<ColumnDef<InvoiceRow>[]>(
    () => [
      {
        accessorKey: "invoiceNumber",
        header: "Invoice ID"
      },
      {
        accessorKey: "issuedLabel",
        header: "Invoice Date"
      },
      {
        accessorKey: "amountLabel",
        header: "Amount"
      },
      {
        id: "paymentMethod",
        header: "Payment Method",
        cell: ({ row }) =>
          row.original.paymentMethodLabel === "Corporate" ? (
            <Badge variant="info">Corporate</Badge>
          ) : (
            <span>Card</span>
          )
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />
      },
      {
        id: "download",
        header: "Download receipt",
        cell: ({ row }) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!row.original.canDownloadReceipt}
            onClick={() => {
              const url = row.original.stripeHostedInvoiceUrl?.trim();
              if (!url) return;
              const anchor = document.createElement("a");
              anchor.href = url;
              anchor.download = `${row.original.invoiceNumber || "receipt"}.pdf`;
              anchor.target = "_blank";
              anchor.rel = "noopener noreferrer";
              document.body.appendChild(anchor);
              anchor.click();
              anchor.remove();
            }}>
            <DownloadIcon />
            Download
          </Button>
        )
      }
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue ?? "")
        .trim()
        .toLowerCase();
      if (!query) return true;
      return row.original.searchLabel.includes(query);
    },
    initialState: { pagination: { pageSize: 10 } }
  });

  return (
    <div className="space-y-3">
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <DataTableFrame
        table={table}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoices…"
        rowCount={table.getFilteredRowModel().rows.length}
        toolbarEnd={
          <>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                if (value == null) return;
                setStatusFilter(value);
                table.setPageIndex(0);
              }}>
              <SelectTrigger size="sm" className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {INVOICE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              preset={preset}
              onPresetChange={setPreset}
            />
          </>
        }>
        <div data-slot="table-container" className="overflow-x-auto">
          <Table className={dataTableClassName}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <DataTableSkeletonRows columnCount={columns.length} />
              ) : table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-muted-foreground h-24 text-center">
                    No invoices in this range.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DataTableFrame>
    </div>
  );
}
