import type { ColumnDef } from "@tanstack/react-table";
import { Download, FileSpreadsheet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { MaterialDetailCard } from "@/components/repository/MaterialDetailCard";
import { ManufacturerSuggestionPanel } from "@/components/repository/ManufacturerSuggestionPanel";
import { VendorRecommendationPanel } from "@/components/repository/VendorRecommendationPanel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { api, API_URL, queryString } from "@/lib/api";
import type { Material, PageResult } from "@/types";

const categories = [
  "All",
  "Active Pharmaceutical Ingredients / APIs",
  "API Intermediates",
  "Excipients",
  "Solvents",
  "Reagents & Catalysts",
  "Primary Packaging Materials",
  "Secondary Packaging Materials",
  "Sterile Manufacturing Consumables",
  "Biologics / Bioprocess Materials",
  "Quality Control / Lab Materials",
  "Engineering & Cleanroom Consumables"
];

export function MaterialsPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [criticality, setCriticality] = useState("All");
  const pageSize = 12;

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      const result = await api<PageResult<Material>>(`/materials?${queryString({ page, pageSize, search, category, criticality })}`);
      setItems(result.items);
      setTotal(result.total);
      setLoading(false);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [category, criticality, page, search]);

  const columns = useMemo<ColumnDef<Material>[]>(() => [
    { accessorKey: "materialCode", header: "Material Code" },
    { accessorKey: "materialName", header: "Material Name" },
    { accessorKey: "industry", header: "Industry" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "subCategory", header: "Subcategory" },
    { accessorKey: "uom", header: "UOM" },
    { accessorKey: "criticality", header: "Criticality", cell: ({ row }) => <Badge status={row.original.criticality}>{row.original.criticality}</Badge> },
    { accessorKey: "regulatoryCategory", header: "Regulatory" },
    { accessorKey: "pharmaGrade", header: "Grade" },
    { id: "mfg", header: "Linked Manufacturers", cell: ({ row }) => row.original._count?.manufacturers || 0 },
    { id: "vendors", header: "Linked Vendors", cell: ({ row }) => row.original._count?.supplyMappings || 0 },
    { accessorKey: "activeStatus", header: "Status", cell: ({ row }) => <Badge>{row.original.activeStatus}</Badge> }
  ], []);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Material Master" description="CDMO / Pharma material repository with 10-digit material codes, regulatory metadata, and linked supply intelligence." />
      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-5">
          <Field className="md:col-span-2"><Label>Search code/name</Label><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></Field>
          <Field><Label>Category</Label><Select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}>{categories.map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <Field><Label>Criticality</Label><Select value={criticality} onChange={(event) => { setCriticality(event.target.value); setPage(1); }}>{["All", "Critical", "High", "Medium", "Low"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
          <div className="flex items-end gap-2">
            <a className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition hover:bg-accent" href={`${API_URL}/materials/export?format=csv`}><Download data-icon="inline-start" /> CSV</a>
            <a className="inline-flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium transition hover:bg-accent" href={`${API_URL}/materials/export?format=xlsx`}><FileSpreadsheet data-icon="inline-start" /> Excel</a>
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
        renderExpanded={(material) => (
          <div className="grid gap-4 xl:grid-cols-3">
            <MaterialDetailCard material={material} />
            <ManufacturerSuggestionPanel materialCode={material.materialCode} />
            <VendorRecommendationPanel materialCode={material.materialCode} />
          </div>
        )}
      />
    </div>
  );
}
