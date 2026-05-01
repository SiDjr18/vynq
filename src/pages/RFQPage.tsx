import type { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/form";
import { api, queryString } from "@/lib/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { PageResult, RFQ } from "@/types";

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
          lineItems: [{ itemCode: form.itemCode, description: form.description, quantity: form.quantity, uom: form.uom, targetPrice: form.targetPrice }]
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
          <Field><Label>Item Code</Label><Input required value={form.itemCode} onChange={(event) => setForm((prev) => ({ ...prev, itemCode: event.target.value }))} /></Field>
          <Field><Label>Description</Label><Input required value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} /></Field>
          <Field><Label>Quantity</Label><Input required type="number" value={form.quantity} onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))} /></Field>
          <div className="flex items-end"><Button><Plus data-icon="inline-start" /> Create RFQ</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
