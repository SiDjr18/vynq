import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiData } from "@/hooks/useApiData";
import { formatCurrency, formatDateTime } from "@/lib/utils";

type ReportData = {
  spendByVendor: Array<{ vendor: string; amount: number; orders: number }>;
  auditLogs: Array<{ id: string; action: string; entity: string; createdAt: string; user?: { firstName: string; lastName: string } }>;
  expiringContracts: Array<{ id: string; contractNo: string; title: string; expiryDate: string; vendor: { company: string } }>;
};

export function ReportsPage() {
  const { data } = useApiData<ReportData>("/reports", []);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Reports" description="Spend, audit, contract expiry, and operational reporting views." />
      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Top Vendor Spend</CardTitle>
            <CardDescription>PO value grouped by vendor.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.spendByVendor || []}>
                <XAxis dataKey="vendor" hide />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" fill="#087f9a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Contract Expiry Alerts</CardTitle>
            <CardDescription>Nearest renewal actions.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {(data?.expiringContracts || []).map((contract) => (
              <div key={contract.id} className="rounded-md border bg-background p-3">
                <p className="text-sm font-semibold">{contract.contractNo} · {contract.title}</p>
                <p className="text-xs text-muted-foreground">{contract.vendor.company} · expires {formatDateTime(contract.expiryDate)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Audit Log</CardTitle>
          <CardDescription>Recent system actions for compliance review.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {(data?.auditLogs || []).map((log) => (
            <div key={log.id} className="rounded-md border bg-background p-3">
              <p className="text-sm font-medium">{log.action} · {log.entity}</p>
              <p className="text-xs text-muted-foreground">{log.user ? `${log.user.firstName} ${log.user.lastName}` : "System"} · {formatDateTime(log.createdAt)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
