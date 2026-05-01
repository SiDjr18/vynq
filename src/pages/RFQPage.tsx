import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { ManufacturerSuggestionPanel } from "@/components/repository/ManufacturerSuggestionPanel";
import { MaterialCodeAutocomplete } from "@/components/repository/MaterialCodeAutocomplete";
import { MaterialDetailCard } from "@/components/repository/MaterialDetailCard";
import { SupplyHistoryPanel } from "@/components/repository/SupplyHistoryPanel";
import { VendorRecommendationPanel } from "@/components/repository/VendorRecommendationPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/form";
import { api, queryString } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Material, PageResult, RFQ, VendorRecommendation } from "@/types";

export function RFQPage() {
  const [items, setItems] = useState<RFQ[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  async function load() {
    setLoading(true);
    try {
      const result = await api<PageResult<RFQ>>(`/rfqs?${queryString({ page, pageSize })}`);
      setItems(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, [page]);

  const columns = useMemo<ColumnDef<RFQ>[]>(() => [
    { accessorKey: "rfqNumber", header: "RFQ Number" },
    { accessorKey: "title", header: "Title" },
    { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge status={row.original.status}>{row.original.status}</Badge> },
    { accessorKey: "quotationDeadline", header: "Quotation Deadline", cell: ({ row }) => formatDateTime(row.original.quotationDeadline) },
    { accessorKey: "freezeTime", header: "Freeze Time", cell: ({ row }) => formatDateTime(row.original.freezeTime) },
    { accessorKey: "negotiationTime", header: "Negotiation", cell: ({ row }) => formatDateTime(row.original.negotiationTime) },
    { id: "quotes", header: "Quotations", cell: ({ row }) => row.original.quotations?.length || 0 }
  ], []);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="RFQ Management" description="Create RFQs, invite vendors, add line items, track freeze time and negotiation schedules." />
      <RFQForm onCreated={load} />
      <DataTable
        data={items}
        columns={columns}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        renderExpanded={(row) => (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-md border bg-card p-3">
              <p className="text-sm font-semibold">Line items</p>
              {(row.lineItems || []).map((item) => (
                <div key={item.id} className="mt-2 flex justify-between gap-3 text-xs">
                  <span>{item.itemCode} · {item.description}</span>
                  <span>{item.quantity} {item.uom} · {item.targetPrice ? formatCurrency(item.targetPrice) : "-"}</span>
                </div>
              ))}
            </div>
            <div className="rounded-md border bg-card p-3">
              <p className="text-sm font-semibold">Vendor quotation comparison</p>
              {(row.quotations || []).map((quote) => (
                <div key={quote.id} className="mt-2 flex justify-between gap-3 text-xs">
                  <span>{quote.vendor.company} · {quote.status}</span>
                  <span>{formatCurrency(quote.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      />
    </div>
  );
}

function RFQForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", quotationDeadline: "", freezeTime: "", negotiationTime: "", itemCode: "", description: "", quantity: "1", uom: "EA", targetPrice: "1000" });
  const [material, setMaterial] = useState<Partial<Material> | null>(null);
  const [selectedVendors, setSelectedVendors] = useState<VendorRecommendation[]>([]);

  function selectMaterial(selected: Partial<Material> | null) {
    setMaterial(selected);
    if (selected?.materialCode) {
      setForm((prev) => ({
        ...prev,
        itemCode: selected.materialCode || "",
        description: selected.materialName || "",
        uom: selected.uom || prev.uom,
        title: prev.title || `${selected.materialName} RFQ`
      }));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/rfqs", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          quotationDeadline: form.quotationDeadline,
          freezeTime: form.freezeTime,
          negotiationTime: form.negotiationTime || undefined,
          lineItems: [{ materialCode: material?.materialCode, itemCode: form.itemCode, description: form.description, quantity: form.quantity, uom: form.uom, targetPrice: form.targetPrice }]
        })
      });
      toast.success("RFQ created");
      onCreated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create RFQ");
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Create RFQ</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-4" onSubmit={submit}>
          <Field className="md:col-span-2"><Label>RFQ Title</Label><Input required value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} /></Field>
          <Field><Label>Quotation Deadline</Label><Input required type="datetime-local" value={form.quotationDeadline} onChange={(event) => setForm((prev) => ({ ...prev, quotationDeadline: event.target.value }))} /></Field>
          <Field><Label>Freeze Time</Label><Input required type="datetime-local" value={form.freezeTime} onChange={(event) => setForm((prev) => ({ ...prev, freezeTime: event.target.value }))} /></Field>
          <Field><Label>Negotiation Schedule</Label><Input type="datetime-local" value={form.negotiationTime} onChange={(event) => setForm((prev) => ({ ...prev, negotiationTime: event.target.value }))} /></Field>
          <Field className="md:col-span-2"><Label>Material Code</Label><MaterialCodeAutocomplete value={material?.materialCode || form.itemCode} onSelect={selectMaterial} /></Field>
          <Field><Label>Description</Label><Input required value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></Field>
          <Field><Label>Quantity</Label><Input required type="number" value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} /></Field>
          <Field><Label>UOM</Label><Input required value={form.uom} onChange={(event) => setForm((prev) => ({ ...prev, uom: event.target.value }))} /></Field>
          <Field><Label>Target Price</Label><Input type="number" value={form.targetPrice} onChange={(event) => setForm((prev) => ({ ...prev, targetPrice: event.target.value }))} /></Field>
          <div className="flex items-end"><Button><Plus data-icon="inline-start" /> Create RFQ</Button></div>
        </form>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <MaterialDetailCard material={material} />
          <SupplyHistoryPanel materialCode={material?.materialCode} />
          <ManufacturerSuggestionPanel materialCode={material?.materialCode} />
          <VendorRecommendationPanel
            materialCode={material?.materialCode}
            onAddVendor={(vendor) => setSelectedVendors((prev) => prev.some((item) => item.vendorCode === vendor.vendorCode) ? prev : [...prev, vendor])}
          />
        </div>
        {selectedVendors.length ? (
          <div className="mt-4 rounded-md border bg-accent/35 p-3 text-xs">
            <p className="font-semibold">Selected RFQ vendors</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedVendors.map((vendor) => <Badge key={vendor.vendorCode}>{vendor.vendorCode} · {vendor.vendorName}</Badge>)}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
