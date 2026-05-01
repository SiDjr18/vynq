import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

type SupplyHistory = {
  materialCode: string;
  lastQuotedPrice: number | null;
  lastPurchasePrice: number | null;
  history: Array<{
    vendorCode: string;
    vendorName: string;
    manufacturerCode: string;
    manufacturerName: string;
    moq: number;
    leadTimeDays: number;
    lastQuotedPrice: number;
    lastPurchasePrice: number;
    lastTransactionDate: string;
    preferredRank: number;
  }>;
};

export function SupplyHistoryPanel({ materialCode }: { materialCode?: string }) {
  const [history, setHistory] = useState<SupplyHistory | null>(null);
  useEffect(() => {
    if (!materialCode) {
      setHistory(null);
      return;
    }
    api<SupplyHistory>(`/materials/${materialCode}/supply-history`).then(setHistory);
  }, [materialCode]);
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Supply History</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        {!history ? <p className="text-sm text-muted-foreground">Select a material to view quotation and purchase memory.</p> : null}
        {history?.history.slice(0, 5).map((row) => (
          <div key={`${row.vendorCode}-${row.manufacturerCode}`} className="flex flex-wrap justify-between gap-2 rounded-md border p-2">
            <span>{row.vendorName} / {row.manufacturerName}</span>
            <span>MOQ {row.moq} · {row.leadTimeDays} days · {formatCurrency(row.lastPurchasePrice)} · {formatDate(row.lastTransactionDate)}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

