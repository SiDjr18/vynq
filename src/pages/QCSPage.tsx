import type { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, queryString } from "@/lib/api";
import type { PageResult, QCS } from "@/types";

export function QCSPage() {
  const [items, setItems] = useState<QCS[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  async function load() {
    setLoading(true);
    const result = await api<PageResult<QCS>>(`/qcs?${queryString({ page, pageSize })}`);
    setItems(result.items);
    setTotal(result.total);
    setLoading(false);
  }
  useEffect(() => { load(); }, [page]);

  async function decide(id: string, status: "Approved" | "Rejected") {
    try {
      await api(`/qcs/${id}/approve`, { method: "PATCH", body: JSON.stringify({ status, comments: `${status} from portal` }) });
      toast.success(`QCS ${status.toLowerCase()}`);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "QCS update failed");
    }
  }

  const columns = useMemo<ColumnDef<QCS>[]>(() => [
    { accessorKey: "qcsCode", header: "QCS Code" },
    { id: "rfq", header: "RFQ", cell: ({ row }) => row.original.rfq?.rfqNumber || "-" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge status={row.original.status}>{row.original.status}</Badge> },
    { accessorKey: "technicalScore", header: "Technical" },
    { accessorKey: "commercialScore", header: "Commercial" },
    { accessorKey: "recommendedVendor", header: "Recommended Vendor" },
    { id: "actions", header: "Actions", cell: ({ row }) => (
      <div className="flex gap-1">
        <Button variant="outline" size="sm" onClick={() => decide(row.original.id, "Approved")}><CheckCircle2 data-icon="inline-start" /> Approve</Button>
        <Button variant="outline" size="sm" onClick={() => decide(row.original.id, "Rejected")}><XCircle data-icon="inline-start" /> Reject</Button>
      </div>
    ) }
  ], []);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="QCS Management" description="Price, technical, and commercial comparison with approval workflow and final vendor recommendation." />
      <DataTable data={items} columns={columns} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} renderExpanded={(row) => (
        <div className="grid gap-3 md:grid-cols-3">
          {(row.approvals || []).map((approval) => (
            <div key={approval.id} className="rounded-md border bg-card p-3">
              <p className="text-sm font-semibold">{approval.role}</p>
              <p className="text-xs text-muted-foreground">{approval.approver}</p>
              <Badge status={approval.status}>{approval.status}</Badge>
            </div>
          ))}
        </div>
      )} />
    </div>
  );
}
