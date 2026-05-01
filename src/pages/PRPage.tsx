import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRightLeft, Plus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { MaterialCodeAutocomplete } from "@/components/repository/MaterialCodeAutocomplete";
import { MaterialDetailCard } from "@/components/repository/MaterialDetailCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { api, queryString } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Material, PageResult, PR } from "@/types";

export function PRPage() {
  const [items, setItems] = useState<PR[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  async function load() {
    setLoading(true);
    try {
      const result = await api<PageResult<PR>>(`/prs?${queryString({ page, pageSize })}`);
      setItems(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [page]);

  async function convert(id: string) {
    try {
      await api(`/prs/${id}/convert-to-rfq`, { method: "POST" });
      toast.success("PR converted to RFQ");
      load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Conversion failed");
    }
  }

  const columns = useMemo<ColumnDef<PR>[]>(() => [
    { accessorKey: "prNumber", header: "PR Number" },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "budget", header: "Budget", cell: ({ row }) => formatCurrency(row.original.budget) },
    { accessorKey: "item", header: "Item" },
    { accessorKey: "quantity", header: "Qty" },
    { accessorKey: "urgency", header: "Urgency", cell: ({ row }) => <Badge>{row.original.urgency}</Badge> },
    { accessorKey: "requiredDate", header: "Required Date", cell: ({ row }) => formatDate(row.original.requiredDate) },
    { accessorKey: "approvalStatus", header: "Approval", cell: ({ row }) => <Badge status={row.original.approvalStatus}>{row.original.approvalStatus}</Badge> },
    { id: "owner", header: "Owner", cell: ({ row }) => row.original.owner ? `${row.original.owner.firstName} ${row.original.owner.lastName}` : "-" },
    { id: "actions", header: "Action", cell: ({ row }) => <Button size="sm" variant="outline" onClick={() => convert(row.original.id)}><ArrowRightLeft data-icon="inline-start" /> RFQ</Button> }
  ], []);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="PR Management" description="Create purchase requisitions, track approvals, and convert approved PRs to RFQs." />
      <PRForm onCreated={load} />
      <DataTable data={items} columns={columns} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}

function PRForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", department: "R&D", budget: "100000", item: "", quantity: "10", urgency: "Medium", requiredDate: "" });
  const [material, setMaterial] = useState<Partial<Material> | null>(null);

  function selectMaterial(selected: Partial<Material> | null) {
    setMaterial(selected);
    if (selected?.materialCode) {
      setForm((prev) => ({ ...prev, item: selected.materialName || "", title: prev.title || `${selected.materialName} purchase requisition` }));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/prs", { method: "POST", body: JSON.stringify(form) });
      toast.success("PR created");
      setForm({ title: "", department: "R&D", budget: "100000", item: "", quantity: "10", urgency: "Medium", requiredDate: "" });
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create PR");
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Create PR</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-4" onSubmit={submit}>
          <Field className="md:col-span-2"><Label>Title</Label><Input required value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} /></Field>
          <Field className="md:col-span-2"><Label>Material Code</Label><MaterialCodeAutocomplete value={material?.materialCode || ""} onSelect={selectMaterial} /></Field>
          <Field><Label>Department</Label><Select value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}>{["R&D", "Manufacturing", "Quality", "Engineering", "Facilities", "IT"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field><Label>Budget</Label><Input required type="number" value={form.budget} onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))} /></Field>
          <Field><Label>Item</Label><Input required value={form.item} onChange={(event) => setForm((prev) => ({ ...prev, item: event.target.value }))} /></Field>
          <Field><Label>Quantity</Label><Input required type="number" value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} /></Field>
          <Field><Label>Urgency</Label><Select value={form.urgency} onChange={(event) => setForm((prev) => ({ ...prev, urgency: event.target.value }))}>{["Low", "Medium", "High", "Critical"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field><Label>Required Date</Label><Input required type="date" value={form.requiredDate} onChange={(event) => setForm((prev) => ({ ...prev, requiredDate: event.target.value }))} /></Field>
          <div className="flex items-end"><Button><Plus data-icon="inline-start" /> Create PR</Button></div>
        </form>
        <div className="mt-4"><MaterialDetailCard material={material} /></div>
      </CardContent>
    </Card>
  );
}
