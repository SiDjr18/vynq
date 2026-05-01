import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/form";
import { useAuthStore } from "@/store/auth";

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Profile" description="Basic account and contact information for the signed-in user." />
      <Card>
        <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field><Label>Company Name</Label><Input readOnly value={user?.companyName || ""} /></Field>
          <Field><Label>First Name</Label><Input readOnly value={user?.firstName || ""} /></Field>
          <Field><Label>Last Name</Label><Input readOnly value={user?.lastName || ""} /></Field>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <Field><Label>Mobile Phone</Label><Input readOnly value={user?.mobilePhone || ""} /></Field>
          <Field><Label>Email Address</Label><Input readOnly value={user?.email || ""} /></Field>
          <div className="flex items-end"><Button variant="outline"><ShieldCheck data-icon="inline-start" /> Change Password</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}
