import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  loading?: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  renderExpanded?: (row: T) => React.ReactNode;
};

export function DataTable<T>({ data, columns, loading, page, pageSize, total, onPageChange, renderExpanded }: Props<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!renderExpanded) return columns;
    return [
      {
        id: "expand",
        header: "",
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" onClick={() => row.toggleExpanded()} aria-label="Expand row">
            {row.getIsExpanded() ? <ChevronDown data-icon="inline-start" /> : <ChevronRight data-icon="inline-start" />}
          </Button>
        )
      },
      ...columns
    ];
  }, [columns, renderExpanded]);
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel()
  });
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="table-scroll overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[980px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-primary text-primary-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="h-10 px-3 text-left text-xs font-semibold">
                    <button className="flex items-center gap-1" onClick={header.column.getToggleSortingHandler()}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="text-primary-foreground/75">{header.column.getIsSorted() === "asc" ? "↑" : header.column.getIsSorted() === "desc" ? "↓" : ""}</span>
                    </button>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <tr key={index} className="border-b">
                  <td colSpan={tableColumns.length} className="p-3">
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <tr className={cn("border-b transition-colors hover:bg-accent/45", row.getIsExpanded() && "bg-accent/35")}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 align-top text-xs">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {row.getIsExpanded() && renderExpanded ? (
                    <tr className="border-b bg-muted/45">
                      <td colSpan={tableColumns.length} className="px-5 py-4">
                        {renderExpanded(row.original)}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={tableColumns.length} className="h-32 text-center text-muted-foreground">
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total Count: {total}</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Previous</Button>
          <span className="text-xs text-muted-foreground">Page {page} of {pageCount}</span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>Next</Button>
        </div>
      </div>
    </div>
  );
}
