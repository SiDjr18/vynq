import type { ColumnDef } from "@tanstack/react-table";
import { Ban, Check, Download, Edit, Eye, Plus, Power, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { useDebounce } from "@/hooks/useDebounce";
import { api, downloadCsv, queryString } from "@/lib/api";
import type { PageResult, Vendor } from "@/types";

const vendorStatuses = ["All", "Approved", "Blocked", "On Hold", "Unapproved", "Inactive"];

export function VendorsPage() {
  const [items, setItems] = useState<Vendor[]>([]);
  const [status, setStatus] = useState("All");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const qs = queryString({ status, search: debouncedSearch, page, pageSize });
      const result = await api<PageResult<Vendor>>(`/vendors?${qs}`);
      setItems(result.items);
      setTotal(result.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status, debouncedSearch, page, pageSize]);

  async function setVendorStatus(id: string, nextStatus: string) {
    try {
      await api(`/vendors/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) });
      toast.success(`Vendor marked ${nextStatus}`);
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Vendor update failed");
    }
  }

  const columns = useMemo<ColumnDef<Vendor>[]>(() => [
    { accessorKey: "company", header: "Company", cell: ({ row }) => <span className="font-medium text-primary">{row.original.company}</span> },
    { accessorKey: "vendorName", header: "Vendor Name" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "vendorCodes", header: "Vendor Code(s)" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge status={row.original.status}>{row.original.status}</Badge> },
    {
      id: "action",
      header: "Action",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="Approve" onClick={() => setVendorStatus(row.original.id, "Approved")}><Check data-icon="inline-start" /></Button>
          <Button variant="ghost" size="icon" title="Block" onClick={() => setVendorStatus(row.original.id, "Blocked")}><Ban data-icon="inline-start" /></Button>
          <Button variant="ghost" size="icon" title="Edit"><Edit data-icon="inline-start" /></Button>
          <Button variant="ghost" size="icon" title="View"><Eye data-icon="inline-start" /></Button>
          <Button variant="ghost" size="icon" title="Deactivate" onClick={() => setVendorStatus(row.original.id, "Inactive")}><Power data-icon="inline-start" /></Button>
        </div>
      )
    }
  ], []);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Vendors"
        description="Manage onboarding, compliance documents, approval state, and vendor profile readiness."
        actions={(
          <>
            <Button onClick={() => downloadCsv("/vendors/export", "vendors.csv")} variant="outline"><Download data-icon="inline-start" /> Export</Button>
            <Link to="/vendors/new"><Button><Plus data-icon="inline-start" /> Add Vendor</Button></Link>
          </>
        )}
      />
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[180px_1fr_auto]">
          <Field>
            <Label>Status</Label>
            <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
              {vendorStatuses.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </Field>
          <Field>
            <Label>Search</Label>
            <Input placeholder="Company, contact, email, code" value={search} onChange={(event) => setSearch(event.target.value)} />
          </Field>
          <div className="flex items-end">
            <Button onClick={load}>Apply</Button>
          </div>
        </CardContent>
      </Card>
      <DataTable
        data={items}
        columns={columns}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        renderExpanded={(row) => (
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Category</p>
              <p className="text-sm">{row.category || "General"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">GST / PAN</p>
              <p className="text-sm">{row.gstNumber || "-"} / {row.panNumber || "-"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Bank</p>
              <p className="text-sm">{row.bankName || "-"} · {row.ifscCode || "-"}</p>
            </div>
            <div className="rounded-md border bg-card p-3">
              <p className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck data-icon="inline-start" /> Risk Score {row.riskScore}</p>
              <p className="mt-1 text-xs text-muted-foreground">Compliance checks are represented with demo document states.</p>
            </div>
          </div>
        )}
      />
    </div>
  );
}
