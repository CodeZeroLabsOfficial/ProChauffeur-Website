"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import { CircleDotIcon, UserIcon, CarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";

import {
  DataTableFrame,
  dataTableClassName
} from "@/components/dashboard/data-table-frame";
import { DataTableSkeletonRows } from "@/components/dashboard/data-table-skeleton";
import { dateInRange } from "@/components/dashboard/date-range-picker";
import { TripStatusBadge } from "@/components/dashboard/trip-status-badge";
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
import {
  createFilterQuery,
  type FilterField,
  type FilterQuery
} from "@/lib/dashboard/filter-query";
import { filterTableRows, tableEmptyMessage } from "@/lib/dashboard/filter-query-match";
import { formatDateTime, shortBookingId } from "@/lib/format";
import { TRIP_STATUSES, tripStatusTitle } from "@/lib/models/enums";
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

export function TripsDataTable({ dateRange }: { dateRange: DateRange | undefined }) {
  const router = useRouter();
  const { user, isCustomer } = useCustomerSession();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<FilterQuery>(() => createFilterQuery());
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

  const datedTrips = useMemo(
    () => trips.filter((trip) => dateInRange(tripPickupReferenceDate(trip), dateRange)),
    [trips, dateRange]
  );

  const data = useMemo<TripRow[]>(
    () =>
      datedTrips.map((trip) => {
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
    [datedTrips]
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
        options: TRIP_STATUSES.map((status) => ({
          value: status,
          label: tripStatusTitle[status]
        }))
      },
      {
        id: "driver",
        label: "Driver",
        type: "text",
        defaultOperator: "contains",
        icon: <UserIcon />,
        placeholder: "Driver name"
      },
      {
        id: "vehicle",
        label: "Vehicle",
        type: "text",
        defaultOperator: "contains",
        icon: <CarIcon />,
        placeholder: "Vehicle"
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
          if (path === "driver") return row.driverLabel;
          if (path === "vehicle") return row.vehicleLabel;
          return undefined;
        },
        (row) => row.searchLabel
      ),
    [data, query, search]
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
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } }
  });

  const emptyLabel = tableEmptyMessage(
    datedTrips.length,
    rows.length,
    "No trips in this range."
  );

  return (
    <div className="space-y-3">
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <DataTableFrame
        table={table}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search trips…"
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
