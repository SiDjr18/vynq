import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useMemo, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/form";
import { useDebounce } from "@/hooks/useDebounce";
import { api, queryString } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { PageResult, Vendor } from "@/types";

type CatalogueItem = { id: string; itemCode: string; name: string; category: string; uom: string; currentPrice: number; previousPrice: number; isActive: boolean; vendor?: Vendor };

export function CataloguePage() {
  const [items, setItems] = useState<CatalogueItem[]>([]);
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;
  useEffect(() => {
    setLoading(true);
    api<PageResult<CatalogueItem>>(`/catalogue?${queryString({ page, pageSize, search: debounced })}`).then((result) => {
      setItems(result.items);
      setTotal(result.total);
      setLoading(false);
    });
  }, [page, debounced]);
  const columns = useMemo<ColumnDef<CatalogueItem>[]>(() => [
    { accessorKey: "itemCode", header: "Item Code" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "uom", header: "UOM" },
    { id: "vendor", header: "Vendor", cell: ({ row }) => row.original.vendor?.company || "-" },
    { accessorKey: "currentPrice", header: "Current Price", cell: ({ row }) => formatCurrency(row.original.currentPrice) },
    { accessorKey: "previousPrice", header: "Previous Price", cell: ({ row }) => formatCurrency(row.original.previousPrice) },
    { accessorKey: "isActive", header: "Status", cell: ({ row }) => <Badge status={row.original.isActive ? "Active" : "Inactive"}>{row.original.isActive ? "Active" : "Inactive"}</Badge> }
  ], []);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Catalogue" description="Item master, vendor catalogue, categories, and price history." />
      <Card><CardContent className="p-4"><Field><Label>Search catalogue</Label><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Item, category, vendor" /></Field></CardContent></Card>
      <DataTable data={items} columns={columns} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    </div>
  );
}
