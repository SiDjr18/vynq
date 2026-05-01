import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label } from "@/components/ui/form";

export function PasswordPage() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (form.next.length < 8) return toast.error("Password must be at least 8 characters");
    if (form.next !== form.confirm) return toast.error("Passwords do not match");
    toast.success("Password validation passed. Demo mode does not change stored credentials.");
  }
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Password Management" description="Change password with validation and security confirmation." />
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={submit}>
            <Field><Label>Current Password</Label><Input type="password" value={form.current} onChange={(event) => setForm((prev) => ({ ...prev, current: event.target.value }))} /></Field>
            <Field><Label>New Password</Label><Input type="password" value={form.next} onChange={(event) => setForm((prev) => ({ ...prev, next: event.target.value }))} /></Field>
            <Field><Label>Confirm New Password</Label><Input type="password" value={form.confirm} onChange={(event) => setForm((prev) => ({ ...prev, confirm: event.target.value }))} /></Field>
            <Button>Validate and Confirm</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
