import { useEffect, useState } from "react";
import { CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import type { VendorRecommendation } from "@/types";

export function VendorRecommendationPanel({ materialCode, onAddVendor }: { materialCode?: string; onAddVendor?: (vendor: VendorRecommendation) => void }) {
  const [items, setItems] = useState<VendorRecommendation[]>([]);
  useEffect(() => {
    if (!materialCode) {
      setItems([]);
      return;
    }
    api<VendorRecommendation[]>(`/materials/${materialCode}/vendors`).then(setItems);
  }, [materialCode]);
  const preferred = items.filter((item) => item.preferredVendorFlag).slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Recommended Vendors</CardTitle>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!preferred.length}
            onClick={() => {
              preferred.forEach((vendor) => onAddVendor?.(vendor));
              toast.success("Preferred vendors added to RFQ draft");
            }}
          >
            <CheckCircle2 data-icon="inline-start" /> Add All Preferred
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {!materialCode ? <p className="text-sm text-muted-foreground">Select a material to see ranked pharma vendors.</p> : null}
        {materialCode && !items.length ? <p className="text-sm text-muted-foreground">No compliant vendor recommendations found.</p> : null}
        {items.slice(0, 6).map((item) => (
          <div key={item.id} className="rounded-md border p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{item.vendorCode} · {item.vendorName}</span>
              <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">{item.recommendationScore}%</span>
            </div>
            <div className="mt-1 text-muted-foreground">
              {item.manufacturerName} · {formatCurrency(item.supplyPrice)} · MOQ {item.moq} · {item.leadTimeDays} days · Last PO {formatCurrency(item.lastPurchasePrice)}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {item.badges.map((badge) => <Badge key={badge} status={badge}>{badge}</Badge>)}
              <Badge status={item.complianceStatus}>{item.complianceStatus}</Badge>
              <Button type="button" size="sm" variant="outline" onClick={() => onAddVendor?.(item)}>
                <Plus data-icon="inline-start" /> Add Vendor to RFQ
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

