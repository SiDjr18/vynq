import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { api, queryString } from "@/lib/api";
import type { PageResult } from "@/types";

type Manufacturer = {
  id: string;
  manufacturerCode: string;
  manufacturerName: string;
  manufacturerType: string;
  city: string;
  country: string;
  qualityCertification: string;
  complianceStatus: string;
  rating: number;
  leadTimeDays: number;
  activeStatus: string;
  _count?: { materials: number; supplyMappings: number };
};

export function ManufacturersPage() {
  const [items, setItems] = useState<Manufacturer[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [complianceStatus, setComplianceStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const pageSize = 12;
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const result = await api<PageResult<Manufacturer>>(`/manufacturers?${queryString({ page, pageSize, search, complianceStatus })}`);
      setItems(result.items);
      setTotal(result.total);
      setLoading(false);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [complianceStatus, page, search]);
  const columns = useMemo<ColumnDef<Manufacturer>[]>(() => [
    { accessorKey: "manufacturerCode", header: "Manufacturer Code" },
    { accessorKey: "manufacturerName", header: "Manufacturer Name" },
    { accessorKey: "manufacturerType", header: "Type" },
    { accessorKey: "city", header: "City" },
    { accessorKey: "country", header: "Country" },
    { accessorKey: "qualityCertification", header: "Certification" },
    { accessorKey: "complianceStatus", header: "Compliance", cell: ({ row }) => <Badge status={row.original.complianceStatus}>{row.original.complianceStatus}</Badge> },
    { accessorKey: "rating", header: "Rating" },
    { accessorKey: "leadTimeDays", header: "Lead Time" },
    { accessorKey: "activeStatus", header: "Status" }
  ], []);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Manufacturer Master" description="Approved CDMO / Pharma manufacturers with certifications, compliance status, lead time, and material coverage." />
      <Card><CardContent className="grid gap-4 p-4 md:grid-cols-3">
        <Field><Label>Search code/name</Label><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></Field>
        <Field><Label>Compliance</Label><Select value={complianceStatus} onChange={(event) => { setComplianceStatus(event.target.value); setPage(1); }}>{["All", "Compliant", "Pending Review", "Expiring Soon", "Non-Compliant"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
      </CardContent></Card>
      <DataTable data={items} columns={columns} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} renderExpanded={(row) => (
        <div className="grid gap-2 text-xs md:grid-cols-3">
          <span>Materials manufactured: {row._count?.materials || 0}</span>
          <span>Vendor mappings: {row._count?.supplyMappings || 0}</span>
          <span>{row.manufacturerName} is maintained as generated dummy pharma data.</span>
        </div>
      )} />
    </div>
  );
}

