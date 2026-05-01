import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { ManufacturerSuggestion } from "@/types";

export function ManufacturerSuggestionPanel({ materialCode }: { materialCode?: string }) {
  const [items, setItems] = useState<ManufacturerSuggestion[]>([]);
  useEffect(() => {
    if (!materialCode) {
      setItems([]);
      return;
    }
    api<ManufacturerSuggestion[]>(`/materials/${materialCode}/manufacturers`).then(setItems);
  }, [materialCode]);

  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Linked Manufacturers</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {!materialCode ? <p className="text-sm text-muted-foreground">Select a material to view approved manufacturers.</p> : null}
        {materialCode && !items.length ? <p className="text-sm text-muted-foreground">No linked manufacturers found.</p> : null}
        {items.slice(0, 5).map((item) => (
          <div key={item.id} className="rounded-md border p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{item.manufacturerCode} · {item.manufacturerName}</span>
              <Badge status={item.complianceStatus}>{item.complianceStatus}</Badge>
            </div>
            <div className="mt-1 text-muted-foreground">
              {item.qualityCertification} · {item.regulatoryCertification} · {item.leadTimeDays} days · Rating {item.rating}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

