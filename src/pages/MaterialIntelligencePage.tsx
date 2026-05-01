import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

type Intelligence = {
  kpis: Record<string, number>;
  materialsByCategory: Array<{ name: string; value: number }>;
  vendorsByType: Array<{ name: string; value: number }>;
  vendorCompliance: Array<{ status: string; count: number }>;
  priceVarianceByCategory: Array<{ category: string; variance: number }>;
};

export function MaterialIntelligencePage() {
  const [data, setData] = useState<Intelligence | null>(null);
  useEffect(() => { api<Intelligence>("/material-intelligence").then(setData); }, []);
  const kpis = data?.kpis || {};
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Material Intelligence" description="CDMO / Pharma repository analytics across materials, manufacturers, vendors, source risk, lead time, and price variance." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Object.entries({
          "Total Pharma Materials": kpis.totalMaterials,
          "Total Manufacturers": kpis.totalManufacturers,
          "Total Vendors": kpis.totalVendors,
          "Material-Manufacturer Links": kpis.materialManufacturerLinks,
          "Vendor Supply Links": kpis.vendorSupplyLinks,
          "High Criticality Materials": kpis.highCriticalityMaterials,
          "Single Source Risk": kpis.singleSourceRiskMaterials,
          "Compliance Risk Vendors": kpis.complianceRiskVendors,
          "Avg Lead Time": kpis.avgLeadTime,
          "Avg Vendor Rating": kpis.avgVendorRating
        }).map(([label, value]) => (
          <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value ?? "-"}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Chart title="Materials by Pharma Category" data={data?.materialsByCategory || []} xKey="name" yKey="value" />
        <Chart title="Vendors by Vendor Type" data={data?.vendorsByType || []} xKey="name" yKey="value" />
        <Chart title="Vendor Compliance Status" data={data?.vendorCompliance || []} xKey="status" yKey="count" />
        <Chart title="Price Variance by Pharma Category" data={data?.priceVarianceByCategory || []} xKey="category" yKey="variance" />
      </div>
    </div>
  );
}

function Chart({ title, data, xKey, yKey }: { title: string; data: object[]; xKey: string; yKey: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xKey} tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={90} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={yKey} fill="#0f7f95" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

