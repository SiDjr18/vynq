import { Bell, Lock, Mail, Users } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Label, Select } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/auth";

export function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" description="User preferences, notifications, and role permission overview." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Bell data-icon="inline-start" /> Notifications</CardTitle><CardDescription>Configure operational alerts.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field><Label>Email digest</Label><Select><option>Daily summary</option><option>Immediate</option><option>Disabled</option></Select></Field>
            <Field><Label>Approval alerts</Label><Select><option>All approval queues</option><option>Assigned only</option></Select></Field>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Lock data-icon="inline-start" /> Security</CardTitle><CardDescription>Session and password policy.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm text-muted-foreground">
            <p>JWT session expiry: 8 hours</p>
            <p>Password length: 8+ recommended</p>
            <p>Rate limiting: enabled at API edge</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users data-icon="inline-start" /> Role Permissions</CardTitle><CardDescription>Current access scope.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(user?.roles || []).map((role) => <Badge key={role}>{role}</Badge>)}
            {(user?.permissions || []).slice(0, 12).map((permission) => <Badge key={permission}>{permission}</Badge>)}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Mail data-icon="inline-start" /> Communication Preferences</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field><Label>RFQ reminders</Label><Select><option>Enabled</option><option>Disabled</option></Select></Field>
          <Field><Label>Vendor onboarding updates</Label><Select><option>Enabled</option><option>Disabled</option></Select></Field>
          <Field><Label>Contract expiry window</Label><Select><option>30 days</option><option>60 days</option><option>90 days</option></Select></Field>
        </CardContent>
      </Card>
    </div>
  );
}
