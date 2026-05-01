import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { MaterialCodeAutocomplete } from "@/components/repository/MaterialCodeAutocomplete";
import { MaterialDetailCard } from "@/components/repository/MaterialDetailCard";
import { VendorRecommendationPanel } from "@/components/repository/VendorRecommendationPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/form";
import { api, queryString } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Material, PageResult, PO, VendorRecommendation } from "@/types";

export function POPage() {
  const [items, setItems] = useState<PO[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  async function load() {
    setLoading(true);
    const result = await api<PageResult<PO>>(`/pos?${queryString({ page, pageSize })}`);
    setItems(result.items);
    setTotal(result.total);
    setLoading(false);
  }
  useEffect(() => { load(); }, [page]);
  const columns = useMemo<ColumnDef<PO>[]>(() => [
    { accessorKey: "poNumber", header: "PO Number" },
    { accessorKey: "title", header: "Title" },
    { id: "vendor", header: "Vendor", cell: ({ row }) => row.original.vendor?.company || "-" },
    { accessorKey: "totalAmount", header: "Amount", cell: ({ row }) => formatCurrency(row.original.totalAmount) },
    { accessorKey: "status", header: "PO Status", cell: ({ row }) => <Badge status={row.original.status}>{row.original.status}</Badge> },
    { accessorKey: "approvalStatus", header: "Approval", cell: ({ row }) => <Badge status={row.original.approvalStatus}>{row.original.approvalStatus}</Badge> },
    { accessorKey: "deliveryDate", header: "Delivery", cell: ({ row }) => formatDate(row.original.deliveryDate) }
  ], []);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="PO Management" description="Generate POs, track approval, vendor acknowledgement, and delivery status." />
      <POForm onCreated={load} />
      <DataTable data={items} columns={columns} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}

function POForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ vendorId: "", title: "", totalAmount: "250000", prNumber: "", deliveryDate: "" });
  const [material, setMaterial] = useState<Partial<Material> | null>(null);
  function selectMaterial(selected: Partial<Material> | null) {
    setMaterial(selected);
    if (selected?.materialCode) setForm((prev) => ({ ...prev, title: prev.title || `${selected.materialName} PO` }));
  }
  function selectVendor(vendor: VendorRecommendation) {
    setForm((prev) => ({ ...prev, vendorId: vendor.id, totalAmount: String(vendor.lastPurchasePrice * vendor.moq), title: prev.title || `${vendor.materialName} PO` }));
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/pos", { method: "POST", body: JSON.stringify(form) });
      toast.success("PO generated");
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create PO");
    }
  }
  return (
    <Card>
      <CardHeader><CardTitle>Generate PO</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-5" onSubmit={submit}>
          <Field className="md:col-span-2"><Label>Material Code</Label><MaterialCodeAutocomplete value={material?.materialCode || ""} onSelect={selectMaterial} /></Field>
          <Field><Label>Vendor ID</Label><Input required placeholder="Use a vendor id from expanded vendor table" value={form.vendorId} onChange={(event) => setForm((prev) => ({ ...prev, vendorId: event.target.value }))} /></Field>
          <Field className="md:col-span-2"><Label>Title</Label><Input required value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} /></Field>
          <Field><Label>Total Amount</Label><Input required type="number" value={form.totalAmount} onChange={(event) => setForm((prev) => ({ ...prev, totalAmount: event.target.value }))} /></Field>
          <Field><Label>Delivery Date</Label><Input type="date" value={form.deliveryDate} onChange={(event) => setForm((prev) => ({ ...prev, deliveryDate: event.target.value }))} /></Field>
          <div className="flex items-end"><Button><Plus data-icon="inline-start" /> Generate PO</Button></div>
        </form>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <MaterialDetailCard material={material} />
          <VendorRecommendationPanel materialCode={material?.materialCode} onAddVendor={selectVendor} />
        </div>
      </CardContent>
    </Card>
  );
}
