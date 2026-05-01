import type { ColumnDef } from "@tanstack/react-table";
import { Play, Plus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { api, queryString } from "@/lib/api";
import { formatDateTime } from "@/lib/utils";
import type { PageResult } from "@/types";

type Connector = {
  id: string;
  connectorName: string;
  industry: string;
  baseUrl: string;
  endpointPath: string;
  method: string;
  authType: string;
  refreshFrequency: string;
  activeStatus: string;
  logs?: Array<{ status: string; importedRecords: number; failedRecords: number; startedAt: string }>;
};

export function DataConnectorsPage() {
  const [items, setItems] = useState<Connector[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  async function load() {
    setLoading(true);
    const result = await api<PageResult<Connector>>(`/data-connectors?${queryString({ page, pageSize })}`);
    setItems(result.items);
    setTotal(result.total);
    setLoading(false);
  }
  useEffect(() => { load(); }, [page]);
  async function sync(id: string) {
    await api(`/data-connectors/${id}/sync`, { method: "POST" });
    toast.success("Mock sync completed");
    load();
  }
  const columns = useMemo<ColumnDef<Connector>[]>(() => [
    { accessorKey: "connectorName", header: "Connector" },
    { accessorKey: "industry", header: "Industry" },
    { accessorKey: "baseUrl", header: "Base URL" },
    { accessorKey: "endpointPath", header: "Endpoint" },
    { accessorKey: "authType", header: "Auth" },
    { accessorKey: "refreshFrequency", header: "Schedule" },
    { accessorKey: "activeStatus", header: "Status", cell: ({ row }) => <Badge>{row.original.activeStatus}</Badge> },
    { id: "last", header: "Last Sync", cell: ({ row }) => row.original.logs?.[0] ? `${row.original.logs[0].status} · ${formatDateTime(row.original.logs[0].startedAt)}` : "-" },
    { id: "run", header: "Action", cell: ({ row }) => <Button size="sm" variant="outline" onClick={() => sync(row.original.id)}><Play data-icon="inline-start" /> Run Sync Now</Button> }
  ], []);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Data Connectors" description="Free local/mock API, JSON, CSV, and Excel ingestion setup for CDMO / Pharma repository data." />
      <ConnectorForm onCreated={load} />
      <DataTable data={items} columns={columns} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}

function ConnectorForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({ connectorName: "Local Pharma Material Mock API", endpointPath: "/mock/pharma-materials.json", baseUrl: "local://mock-api", method: "GET", authType: "None", refreshFrequency: "Manual" });
  async function submit(event: FormEvent) {
    event.preventDefault();
    await api("/data-connectors", { method: "POST", body: JSON.stringify({ ...form, industry: "CDMO / Pharma", fieldMappingJson: JSON.stringify({ materialCode: "materialCode", materialName: "materialName" }) }) });
    toast.success("Connector created");
    onCreated();
  }
  return (
    <Card>
      <CardHeader><CardTitle>Create Mock Connector</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-4" onSubmit={submit}>
          <Field><Label>Connector Name</Label><Input value={form.connectorName} onChange={(event) => setForm((prev) => ({ ...prev, connectorName: event.target.value }))} /></Field>
          <Field><Label>Base URL</Label><Input value={form.baseUrl} onChange={(event) => setForm((prev) => ({ ...prev, baseUrl: event.target.value }))} /></Field>
          <Field><Label>Endpoint</Label><Input value={form.endpointPath} onChange={(event) => setForm((prev) => ({ ...prev, endpointPath: event.target.value }))} /></Field>
          <Field><Label>Auth Type</Label><Select value={form.authType} onChange={(event) => setForm((prev) => ({ ...prev, authType: event.target.value }))}>{["None", "API Key", "Bearer Token", "Basic Auth"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <div className="flex items-end"><Button><Plus data-icon="inline-start" /> Create Connector</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}
