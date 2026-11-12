"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { TripStatusBadge } from "@/components/dashboard/trip-status-badge";
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
import { listenCustomerTrips } from "@/lib/dashboard/customer-trips";
import { formatDateTime, shortBookingId } from "@/lib/format";
import { TRIP_STATUSES } from "@/lib/models/enums";
import {
  tripDriverLabel,
  tripPickupReferenceDate,
  tripVehicleLabel,
  type Trip
} from "@/lib/models/trip";

type TripRow = Trip & {
  bookingIdLabel: string;
  pickupLabel: string;
  driverLabel: string;
  vehicleLabel: string;
  searchLabel: string;
};

export function TripsDataTable() {
  const router = useRouter();
  const { user, isCustomer } = useCustomerSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [preset, setPreset] = useState<DateRangePreset>("thisWeek");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => thisWeekRange());
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    if (!isCustomer || !user?.uid) {
      setTrips([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return listenCustomerTrips(
      user.uid,
      (next) => {
        setTrips(next);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message || "Could not load trips.");
        setLoading(false);
      }
    );
  }, [isCustomer, user?.uid]);

  const rows = useMemo<TripRow[]>(
    () =>
      trips
        .filter((trip) => dateInRange(tripPickupReferenceDate(trip), dateRange))
        .filter((trip) => (statusFilter === "all" ? true : trip.status === statusFilter))
        .map((trip) => {
          const bookingIdLabel = shortBookingId(trip.id);
          const driverLabel = tripDriverLabel(trip);
          const vehicleLabel = tripVehicleLabel(trip);
          const pickupLabel = formatDateTime(tripPickupReferenceDate(trip));
          return {
            ...trip,
            bookingIdLabel,
            pickupLabel,
            driverLabel,
            vehicleLabel,
            searchLabel: [bookingIdLabel, driverLabel, vehicleLabel, pickupLabel]
              .join(" ")
              .toLowerCase()
          };
        }),
    [trips, dateRange, statusFilter]
  );

  const columns = useMemo<ColumnDef<TripRow>[]>(
    () => [
      {
        accessorKey: "bookingIdLabel",
        header: "Booking ID",
        cell: ({ row }) => (
          <Link
            href={`/dashboard/trips/${row.original.id}`}
            className="font-medium underline-offset-4 hover:underline">
            {row.original.bookingIdLabel}
          </Link>
        )
      },
      {
        accessorKey: "pickupLabel",
        header: "Pickup Date and Time"
      },
      {
        accessorKey: "driverLabel",
        header: "Driver"
      },
      {
        accessorKey: "vehicleLabel",
        header: "Vehicle"
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <TripStatusBadge status={row.original.status} />
      }
    ],
    []
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      globalFilter: search
    },
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
        searchPlaceholder="Search trips…"
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
                {TRIP_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.replaceAll("_", " ")}
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
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    onClick={() => {
                      router.push(`/dashboard/trips/${row.original.id}`);
                    }}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-muted-foreground h-24 text-center">
                    No trips in this range.
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
