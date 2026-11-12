"use client";

import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import { CircleDotIcon, CreditCardIcon, DownloadIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import {
  DataTableFrame,
  dataTableClassName
} from "@/components/dashboard/data-table-frame";
import { DataTableSkeletonRows } from "@/components/dashboard/data-table-skeleton";
import { dateInRange } from "@/components/dashboard/date-range-picker";
import { InvoiceStatusBadge } from "@/components/dashboard/invoice-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  createFilterQuery,
  type FilterField,
  type FilterQuery
} from "@/lib/dashboard/filter-query";
import { filterTableRows, tableEmptyMessage } from "@/lib/dashboard/filter-query-match";
import { formatDate, formatMoneyAmount } from "@/lib/format";
import { INVOICE_STATUSES, invoiceStatusTitle } from "@/lib/models/enums";
import { invoiceIsCorporate, type Invoice } from "@/lib/models/invoice";

type InvoiceRow = Invoice & {
  searchLabel: string;
  issuedLabel: string;
  amountLabel: string;
  paymentMethodLabel: "Corporate" | "Card";
  paymentMethodValue: "corporate" | "card";
  canDownloadReceipt: boolean;
};

export function BillingDataTable({ dateRange }: { dateRange: DateRange | undefined }) {
  const { user, isCustomer } = useCustomerSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
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

  const datedInvoices = useMemo(
    () => invoices.filter((invoice) => dateInRange(invoice.issuedAt, dateRange)),
    [invoices, dateRange]
  );

  const data = useMemo<InvoiceRow[]>(
    () =>
      datedInvoices.map((invoice) => {
        const isCorporate = invoiceIsCorporate(invoice);
        const paymentMethodLabel = isCorporate ? "Corporate" : "Card";
        const paymentMethodValue = isCorporate ? "corporate" : "card";
        const issuedLabel = formatDate(invoice.issuedAt);
        const amountLabel = formatMoneyAmount(invoice.total, invoice.currencyCode);
        const canDownloadReceipt = Boolean(invoice.stripeHostedInvoiceUrl?.trim());
        return {
          ...invoice,
          paymentMethodLabel,
          paymentMethodValue,
          issuedLabel,
          amountLabel,
          canDownloadReceipt,
          searchLabel: [invoice.invoiceNumber, amountLabel, paymentMethodLabel, issuedLabel]
            .join(" ")
            .toLowerCase()
        };
      }),
    [datedInvoices]
  );

  const fields = useMemo<FilterField[]>(
    () => [
      {
        id: "status",
        label: "Status",
        type: "select",
        defaultOperator: "is_any_of",
        searchable: false,
        icon: <CircleDotIcon />,
        options: INVOICE_STATUSES.map((status) => ({
          value: status,
          label: invoiceStatusTitle[status]
        }))
      },
      {
        id: "paymentMethod",
        label: "Payment Method",
        type: "select",
        defaultOperator: "is_any_of",
        searchable: false,
        icon: <CreditCardIcon />,
        options: [
          { value: "card", label: "Card" },
          { value: "corporate", label: "Corporate" }
        ]
      }
    ],
    []
  );

  const rows = useMemo(
    () =>
      filterTableRows(
        data,
        query,
        search,
        (row, path) => {
          if (path === "status") return row.status;
          if (path === "paymentMethod") return row.paymentMethodValue;
          return undefined;
        },
        (row) => row.searchLabel
      ),
    [data, query, search]
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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  const emptyLabel = tableEmptyMessage(
    datedInvoices.length,
    rows.length,
    "No invoices in this range."
  );

  return (
    <div className="space-y-3">
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <DataTableFrame
        table={table}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search invoices…"
        fields={fields}
        query={query}
        onQueryChange={setQuery}
        rowCount={rows.length}>
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
                    {emptyLabel}
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
