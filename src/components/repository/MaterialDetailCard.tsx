import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Material } from "@/types";

type Props = {
  material?: Partial<Material> | null;
};

export function MaterialDetailCard({ material }: Props) {
  if (!material?.materialCode) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-4 text-sm text-muted-foreground">
          Select a CDMO / Pharma material code to auto-capture material details.
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          {material.materialCode} · {material.materialName}
          <Badge status={material.criticality}>{material.criticality}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-xs md:grid-cols-3">
        <Detail label="Category" value={material.category} />
        <Detail label="Subcategory" value={material.subCategory} />
        <Detail label="UOM" value={material.uom} />
        <Detail label="Regulatory" value={material.regulatoryCategory} />
        <Detail label="Pharma Grade" value={material.pharmaGrade} />
        <Detail label="Storage" value={material.storageCondition} />
        <Detail label="HSN" value={material.hsnCode} />
        <Detail label="Shelf Life" value={material.shelfLifeMonths ? `${material.shelfLifeMonths} months` : "-"} />
        <Detail label="Specification" value={material.specification} />
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value?: string | number }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "-"}</p>
    </div>
  );
}

