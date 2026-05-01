import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, FileDown, MessageCircle, Plus, RefreshCcw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { CloneRequirementModal } from "@/components/repository/CloneRequirementModal";
import { MaterialCodeAutocomplete } from "@/components/repository/MaterialCodeAutocomplete";
import { MaterialDetailCard } from "@/components/repository/MaterialDetailCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/form";
import { useDebounce } from "@/hooks/useDebounce";
import { api, downloadCsv, queryString } from "@/lib/api";
import { formatDate, formatDateTime } from "@/lib/utils";
import type { Material, PageResult, Requirement } from "@/types";

const statuses = [
  "All Status",
  "Quotations Pending",
  "Negotiation Started",
  "Negotiation Scheduled",
  "Negotiation Cancelled",
  "Quotations Received",
  "Saved As Draft",
  "QCS Created",
  "QCS Pending",
  "QCS Approval Pending",
  "QCS Approved",
  "Closed"
];

type Poster = { id: string; firstName: string; lastName: string };

export function RequirementsPage({ createMode = false }: { createMode?: boolean }) {
  const [items, setItems] = useState<Requirement[]>([]);
  const [filters, setFilters] = useState({ status: "All Status", postedBy: "All", search: "", fromDate: "", toDate: "" });
  const debouncedSearch = useDebounce(filters.search);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const qs = queryString({ ...filters, search: debouncedSearch, page, pageSize });
      const result = await api<PageResult<Requirement> & { filters: { posters: Poster[] } }>(`/requirements?${qs}`);
      setItems(result.items);
      setTotal(result.total);
      setPosters(result.filters.posters);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load requirements");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [page, pageSize, debouncedSearch]);

  async function updateStatus(id: string, status: string) {
    try {
      await api(`/requirements/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      toast.success("Requirement workflow updated");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Status update failed");
    }
  }

  const columns = useMemo<ColumnDef<Requirement>[]>(() => [
    { accessorKey: "rfqNumber", header: "RFQ Number" },
    { accessorKey: "rfqType", header: "RFQ Type" },
    { accessorKey: "title", header: "Title", cell: ({ row }) => <span className="font-medium text-primary">{row.original.title}</span> },
    { id: "postedBy", header: "Posted By", cell: ({ row }) => `${row.original.postedBy.firstName} ${row.original.postedBy.lastName}` },
    { accessorKey: "quotationStatus", header: "Quotation Status" },
    { accessorKey: "postedOn", header: "Posted On", cell: ({ row }) => formatDateTime(row.original.postedOn) },
    { accessorKey: "freezeTime", header: "Freeze Time", cell: ({ row }) => formatDateTime(row.original.freezeTime) },
    { accessorKey: "negotiationTime", header: "Negotiation Time", cell: ({ row }) => formatDateTime(row.original.negotiationTime) },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge status={row.original.status}>{row.original.status}</Badge> },
    { accessorKey: "projectName", header: "Project Name" },
    { accessorKey: "clientName", header: "Client Name" },
    { accessorKey: "prNumber", header: "PR Number" },
    { accessorKey: "qcsCode", header: "QCS Code" },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" title="View"><Eye data-icon="inline-start" /></Button>
          <Button variant="ghost" size="icon" title="Edit"><Edit data-icon="inline-start" /></Button>
          <CloneRequirementModal requirementId={row.original.id} onCloned={load} />
          <Button variant="ghost" size="icon" title="Comments"><MessageCircle data-icon="inline-start" /></Button>
        </div>
      )
    }
  ], []);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={createMode ? "Create Requirement" : "My Requirements List"}
        description="Server-side filtered RFQ requirements with row expansion, workflow updates, comments, and reports."
        actions={!createMode ? (
          <>
            <Button variant="outline" onClick={() => downloadCsv("/requirements/export", "requirements.csv")}><FileDown data-icon="inline-start" /> Reports</Button>
            <Button onClick={() => setFilters({ status: "All Status", postedBy: "All", search: "", fromDate: "", toDate: "" })}><RefreshCcw data-icon="inline-start" /> Reset</Button>
          </>
        ) : undefined}
      />

      {createMode ? <RequirementForm onCreated={load} /> : null}

      {!createMode ? (
        <>
          <Card>
            <CardContent className="grid gap-3 p-4 md:grid-cols-6">
              <Field>
                <Label>All Status</Label>
                <Select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}>
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </Select>
              </Field>
              <Field className="md:col-span-2">
                <Label>Search</Label>
                <Input placeholder="RFQ, title, project, PR, QCS" value={filters.search} onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))} />
              </Field>
              <Field>
                <Label>Posted By</Label>
                <Select value={filters.postedBy} onChange={(event) => setFilters((prev) => ({ ...prev, postedBy: event.target.value }))}>
                  <option value="All">All</option>
                  {posters.map((poster) => <option value={poster.id} key={poster.id}>{poster.firstName} {poster.lastName}</option>)}
                </Select>
              </Field>
              <Field>
                <Label>From Date</Label>
                <Input type="date" value={filters.fromDate} onChange={(event) => setFilters((prev) => ({ ...prev, fromDate: event.target.value }))} />
              </Field>
              <Field>
                <Label>To Date</Label>
                <Input type="date" value={filters.toDate} onChange={(event) => setFilters((prev) => ({ ...prev, toDate: event.target.value }))} />
              </Field>
              <div className="flex items-end">
                <Button onClick={() => { setPage(1); load(); }}>Apply</Button>
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
              <div className="grid gap-4 md:grid-cols-[1fr_280px]">
                <div>
                  <p className="text-sm font-semibold">{row.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Posted {formatDate(row.postedOn)} for {row.projectName || "General procurement"}.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {statuses.filter((status) => status !== "All Status").slice(0, 7).map((status) => (
                      <Button key={status} variant="outline" size="sm" onClick={() => updateStatus(row.id, status)}>{status}</Button>
                    ))}
                  </div>
                </div>
                <div className="rounded-md border bg-card p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Recent comments</p>
                  <div className="mt-2 flex flex-col gap-2">
                    {(row.comments || []).map((comment) => <p key={comment.id} className="text-xs">{comment.body}</p>)}
                  </div>
                </div>
              </div>
            )}
          />
        </>
      ) : null}
    </div>
  );
}

function RequirementForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", rfqType: "RFQ", projectName: "", clientName: "", prNumber: "", status: "Saved As Draft" });
  const [material, setMaterial] = useState<Partial<Material> | null>(null);

  function selectMaterial(selected: Partial<Material> | null) {
    setMaterial(selected);
    if (selected?.materialCode) setForm((prev) => ({ ...prev, title: prev.title || `${selected.materialName} requirement` }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/requirements", { method: "POST", body: JSON.stringify(form) });
      toast.success("Requirement created");
      setForm({ title: "", rfqType: "RFQ", projectName: "", clientName: "", prNumber: "", status: "Saved As Draft" });
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Create requirement failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New requirement</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={submit}>
          <Field className="md:col-span-2">
            <Label>Title</Label>
            <Input required value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} />
          </Field>
          <Field>
            <Label>Material Code</Label>
            <MaterialCodeAutocomplete value={material?.materialCode || ""} onSelect={selectMaterial} />
          </Field>
          <Field>
            <Label>RFQ Type</Label>
            <Select value={form.rfqType} onChange={(event) => setForm((prev) => ({ ...prev, rfqType: event.target.value }))}>
              <option>RFQ</option>
              <option>RFI</option>
              <option>Reverse Auction</option>
            </Select>
          </Field>
          <Field>
            <Label>Project Name</Label>
            <Input value={form.projectName} onChange={(event) => setForm((prev) => ({ ...prev, projectName: event.target.value }))} />
          </Field>
          <Field>
            <Label>Client Name</Label>
            <Input value={form.clientName} onChange={(event) => setForm((prev) => ({ ...prev, clientName: event.target.value }))} />
          </Field>
          <Field>
            <Label>PR Number</Label>
            <Input value={form.prNumber} onChange={(event) => setForm((prev) => ({ ...prev, prNumber: event.target.value }))} />
          </Field>
          <Field className="md:col-span-3">
            <Label>Description / internal note</Label>
            <Textarea placeholder="Add notes for buying team, category, compliance, or delivery constraints." />
          </Field>
          <div className="md:col-span-3">
            <Button><Plus data-icon="inline-start" /> Create Requirement</Button>
          </div>
        </form>
        <div className="mt-4"><MaterialDetailCard material={material} /></div>
      </CardContent>
    </Card>
  );
}
