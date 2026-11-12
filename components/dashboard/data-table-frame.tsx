"use client";

import type { ReactNode } from "react";
import type { Table } from "@tanstack/react-table";
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon } from "lucide-react";

import { TableFilters } from "@/components/dashboard/table-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { FilterField, FilterQuery } from "@/lib/dashboard/filter-query";

export const dataTableClassName =
  "[&_td:first-child]:ps-4 [&_td:last-child]:pe-4 [&_th:first-child]:ps-4 [&_th:last-child]:pe-4";

export function DataTableFrame<TData>({
  table,
  search,
  onSearchChange,
  searchPlaceholder,
  fields,
  query,
  onQueryChange,
  pageSizes = [10, 25, 50],
  rowCount,
  toolbarEnd,
  children
}: {
  table: Table<TData>;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  fields?: FilterField[];
  query?: FilterQuery;
  onQueryChange?: (query: FilterQuery) => void;
  pageSizes?: number[];
  rowCount: number;
  toolbarEnd?: ReactNode;
  children: ReactNode;
}) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = Math.max(table.getPageCount(), 1);
  const firstRow = rowCount === 0 ? 0 : pageIndex * pageSize + 1;
  const lastRow = Math.min((pageIndex + 1) * pageSize, rowCount);

  return (
    <Card>
      <CardContent className="flex flex-col p-0">
        <div className="flex min-h-14 flex-wrap items-center gap-2 border-b px-4 py-3">
          <div className="relative">
            <SearchIcon className="text-muted-foreground absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(event) => {
                onSearchChange(event.target.value);
                table.setPageIndex(0);
              }}
              className="h-7 w-40 ps-8 text-[0.8rem] lg:w-56"
            />
          </div>
          {fields && query && onQueryChange ? (
            <TableFilters
              fields={fields}
              query={query}
              onQueryChange={(next) => {
                onQueryChange(next);
                table.setPageIndex(0);
              }}
              className="flex-1"
            />
          ) : null}
          {toolbarEnd}
        </div>

        {children}

        <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 sm:flex-row">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            Rows per page
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                if (value == null) return;
                table.setPageSize(Number(value));
              }}>
              <SelectTrigger size="sm" className="w-fit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizes.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm tabular-nums">
              {firstRow} - {lastRow} of {rowCount}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}>
                <span className="sr-only">Previous page</span>
                <ChevronLeftIcon />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}>
                <span className="sr-only">Next page</span>
                <ChevronRightIcon />
              </Button>
              <span className="text-muted-foreground text-xs tabular-nums">
                {pageIndex + 1}/{pageCount}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
