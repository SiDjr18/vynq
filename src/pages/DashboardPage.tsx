import { Activity, ClipboardCheck, Database, Factory, FileClock, Handshake, Network, PackageCheck, Users } from "lucide-react";
import { Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiData } from "@/hooks/useApiData";
import { formatDateTime } from "@/lib/utils";

type Dashboard = {
  kpis: Record<string, number>;
  rfqStatus: Array<{ name: string; value: number }>;
  vendorStatus: Array<{ name: string; value: number }>;
  monthlyActivity: Array<{ month: string; value: number }>;
  activity: Array<{ id: string; action: string; entity: string; createdAt: string; user: string }>;
};

const kpiConfig = [
  ["openRfqs", "Open RFQs", ClipboardCheck],
  ["openRfps", "Open RFPs", FileClock],
  ["activeVendors", "Active Vendors", Users],
  ["pendingPos", "Pending POs", PackageCheck],
  ["qcsApprovalPending", "QCS Pending", Activity],
  ["pendingContracts", "Pending Contracts", Handshake]
] as const;

const colors = ["#087f9a", "#14b8a6", "#f59e0b", "#64748b", "#2563eb", "#ef4444", "#7c3aed"];

export function DashboardPage() {
  const { data, loading } = useApiData<Dashboard>("/dashboard", []);
  const { data: intelligence } = useApiData<{ kpis: Record<string, number> }>("/material-intelligence", []);
  const pharmaKpis = [
    ["totalMaterials", "Pharma Materials", Database],
    ["totalManufacturers", "Manufacturers", Factory],
    ["totalVendors", "Pharma Vendors", Users],
    ["vendorSupplyLinks", "Supply Links", Network],
    ["highCriticalityMaterials", "Critical Materials", Activity],
    ["complianceRiskVendors", "Compliance Risk", FileClock]
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Dashboard" description="Live procurement health, approval queues, vendor activity, and recent system events." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {pharmaKpis.map(([key, label, Icon]) => (
          <Card key={key} className="border-primary/20">
            <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
              <CardDescription>{label}</CardDescription>
              <Icon className="text-primary" data-icon="inline-start" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{intelligence?.kpis[key] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {kpiConfig.map(([key, label, Icon]) => (
          <Card key={key}>
            <CardHeader className="flex-row items-center justify-between gap-3 pb-2">
              <CardDescription>{label}</CardDescription>
              <Icon className="text-primary" data-icon="inline-start" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-20" /> : <p className="text-3xl font-semibold">{data?.kpis[key] ?? 0}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Procurement Activity</CardTitle>
            <CardDescription>RFQs posted over the recent seeded operating window.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthlyActivity || []}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line dataKey="value" stroke="#087f9a" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>RFQ Status Mix</CardTitle>
            <CardDescription>Distribution across negotiation and QCS stages.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.rfqStatus || []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {(data?.rfqStatus || []).map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Status</CardTitle>
            <CardDescription>Onboarding and approval posture.</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.vendorStatus || []} dataKey="value" nameKey="name" outerRadius={90}>
                  {(data?.vendorStatus || []).map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Audit trail events from create, approval, and workflow actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {(data?.activity || []).map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 rounded-md border bg-background p-3">
                  <div>
                    <p className="text-sm font-medium">{item.action} · {item.entity}</p>
                    <p className="text-xs text-muted-foreground">{item.user}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
