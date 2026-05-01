import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { MaterialCodeAutocomplete } from "@/components/repository/MaterialCodeAutocomplete";
import { MaterialDetailCard } from "@/components/repository/MaterialDetailCard";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { api, queryString } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Material, PageResult } from "@/types";

type NetworkRow = {
  id: string;
  materialCode: string;
  manufacturerCode: string;
  vendorCode: string;
  supplyPrice: number;
  currency: string;
  moq: number;
  leadTimeDays: number;
  lastPurchasePrice: number;
  preferredRank: number;
  supplyStatus: string;
  lastTransactionDate: string;
  recommendationScore: number;
  material: { materialName: string; category: string };
  manufacturer: { manufacturerName: string };
  vendor: { vendorName: string; vendorType?: string; complianceStatus?: string; preferredVendorFlag: boolean };
};

export function VendorSupplyNetworkPage() {
  const [items, setItems] = useState<NetworkRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [vendorType, setVendorType] = useState("All");
  const [selectedMaterial, setSelectedMaterial] = useState<Partial<Material> | null>(null);
  const [loading, setLoading] = useState(true);
  const pageSize = 12;
  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const querySearch = selectedMaterial?.materialCode || search;
      const result = await api<PageResult<NetworkRow>>(`/vendor-supply-network?${queryString({ page, pageSize, search: querySearch, vendorType })}`);
      setItems(result.items);
      setTotal(result.total);
      setLoading(false);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [page, search, selectedMaterial?.materialCode, vendorType]);
  const columns = useMemo<ColumnDef<NetworkRow>[]>(() => [
    { accessorKey: "materialCode", header: "Material Code" },
    { id: "material", header: "Material", cell: ({ row }) => row.original.material.materialName },
    { id: "manufacturer", header: "Manufacturer", cell: ({ row }) => `${row.original.manufacturerCode} · ${row.original.manufacturer.manufacturerName}` },
    { id: "vendor", header: "Vendor", cell: ({ row }) => `${row.original.vendorCode} · ${row.original.vendor.vendorName}` },
    { id: "price", header: "Price", cell: ({ row }) => `${row.original.currency} ${formatCurrency(row.original.supplyPrice)}` },
    { accessorKey: "moq", header: "MOQ" },
    { accessorKey: "leadTimeDays", header: "Lead Time" },
    { accessorKey: "preferredRank", header: "Rank" },
    { accessorKey: "recommendationScore", header: "Score", cell: ({ row }) => <Badge>{row.original.recommendationScore}%</Badge> },
    { accessorKey: "supplyStatus", header: "Status", cell: ({ row }) => <Badge status={row.original.supplyStatus}>{row.original.supplyStatus}</Badge> }
  ], []);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Vendor Supply Network" description="Material -> manufacturer -> vendor supply relationships with price, MOQ, lead time, compliance, and recommendation score." />
      <Card><CardContent className="grid gap-4 p-4 lg:grid-cols-4">
        <Field className="lg:col-span-2"><Label>Smart Material Code Lookup</Label><MaterialCodeAutocomplete value={selectedMaterial?.materialCode || ""} onSelect={setSelectedMaterial} /></Field>
        <Field><Label>Search vendor/manufacturer/code</Label><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></Field>
        <Field><Label>Vendor Type</Label><Select value={vendorType} onChange={(event) => { setVendorType(event.target.value); setPage(1); }}>{["All", "API Distributor", "Excipient Distributor", "Packaging Supplier", "Lab Material Supplier", "Cleanroom Consumables Supplier", "CDMO Supply Partner", "Solvent Supplier", "Reagent Supplier", "Bioprocess Supplier", "Engineering Consumables Supplier"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
      </CardContent></Card>
      {selectedMaterial ? <MaterialDetailCard material={selectedMaterial} /> : null}
      <DataTable data={items} columns={columns} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} renderExpanded={(row) => (
        <div className="grid gap-2 text-xs md:grid-cols-4">
          <span>Category: {row.material.category}</span>
          <span>Last purchase: {formatCurrency(row.lastPurchasePrice)}</span>
          <span>Last transaction: {formatDate(row.lastTransactionDate)}</span>
          <span>{row.vendor.preferredVendorFlag ? "Preferred vendor" : "Standard vendor"}</span>
        </div>
      )} />
    </div>
  );
}

