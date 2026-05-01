import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { api, queryString } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { PageResult, Vendor } from "@/types";

type Contract = { id: string; contractNo: string; title: string; fileName?: string; startDate: string; expiryDate: string; renewalStatus: string; value: number; vendor?: Vendor };

export function ContractsPage() {
  const [items, setItems] = useState<Contract[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  useEffect(() => {
    setLoading(true);
    api<PageResult<Contract>>(`/contracts?${queryString({ page, pageSize })}`).then((result) => {
      setItems(result.items);
      setTotal(result.total);
      setLoading(false);
    });
  }, [page]);
  const columns = useMemo<ColumnDef<Contract>[]>(() => [
    { accessorKey: "contractNo", header: "Contract No" },
    { accessorKey: "title", header: "Title" },
    { id: "vendor", header: "Vendor", cell: ({ row }) => row.original.vendor?.company || "-" },
    { accessorKey: "startDate", header: "Start", cell: ({ row }) => formatDate(row.original.startDate) },
    { accessorKey: "expiryDate", header: "Expiry", cell: ({ row }) => formatDate(row.original.expiryDate) },
    { accessorKey: "renewalStatus", header: "Renewal", cell: ({ row }) => <Badge status={row.original.renewalStatus}>{row.original.renewalStatus}</Badge> },
    { accessorKey: "value", header: "Value", cell: ({ row }) => formatCurrency(row.original.value) },
    { accessorKey: "fileName", header: "File" }
  ], []);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Contract Management" description="Contract list, expiry alerts, upload placeholders, renewal status, and vendor linkage." />
      <DataTable data={items} columns={columns} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
