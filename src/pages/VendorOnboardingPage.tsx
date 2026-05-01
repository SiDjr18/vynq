import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Label, Select } from "@/components/ui/form";
import { api } from "@/lib/api";

export function VendorOnboardingPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company: "",
    vendorName: "",
    phone: "",
    email: "",
    vendorCodes: "",
    status: "Unapproved",
    category: "Active Pharmaceutical Ingredients / APIs",
    gstNumber: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
    ifscCode: ""
  });

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      await api("/vendors", { method: "POST", body: JSON.stringify(form) });
      toast.success("Vendor onboarding submitted");
      navigate("/vendors");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add vendor");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Add Vendor / Vendor Onboarding" description="Capture company, contact, compliance, banking, category, and approval workflow information." />
      <form className="grid gap-4 xl:grid-cols-[1fr_340px]" onSubmit={submit}>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Company details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field><Label>Company</Label><Input required value={form.company} onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))} /></Field>
              <Field><Label>Vendor Code(s)</Label><Input required value={form.vendorCodes} onChange={(event) => setForm((prev) => ({ ...prev, vendorCodes: event.target.value }))} /></Field>
              <Field><Label>Category</Label><Select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>{["Active Pharmaceutical Ingredients / APIs", "API Intermediates", "Excipients", "Solvents", "Reagents & Catalysts", "Primary Packaging Materials", "Secondary Packaging Materials", "Sterile Manufacturing Consumables", "Biologics / Bioprocess Materials", "Quality Control / Lab Materials", "Engineering & Cleanroom Consumables"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
              <Field><Label>Approval Status</Label><Select value={form.status} onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}>{["Unapproved", "Approved", "On Hold"].map((item) => <option key={item}>{item}</option>)}</Select></Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Contact person details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field><Label>Vendor Name</Label><Input required value={form.vendorName} onChange={(event) => setForm((prev) => ({ ...prev, vendorName: event.target.value }))} /></Field>
              <Field><Label>Phone</Label><Input required value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} /></Field>
              <Field><Label>Email</Label><Input required type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} /></Field>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>GST/PAN and bank details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Field><Label>GST Number</Label><Input value={form.gstNumber} onChange={(event) => setForm((prev) => ({ ...prev, gstNumber: event.target.value }))} /></Field>
              <Field><Label>PAN Number</Label><Input value={form.panNumber} onChange={(event) => setForm((prev) => ({ ...prev, panNumber: event.target.value }))} /></Field>
              <Field><Label>Bank Name</Label><Input value={form.bankName} onChange={(event) => setForm((prev) => ({ ...prev, bankName: event.target.value }))} /></Field>
              <Field><Label>Account Number</Label><Input value={form.accountNumber} onChange={(event) => setForm((prev) => ({ ...prev, accountNumber: event.target.value }))} /></Field>
              <Field><Label>IFSC Code</Label><Input value={form.ifscCode} onChange={(event) => setForm((prev) => ({ ...prev, ifscCode: event.target.value }))} /></Field>
            </CardContent>
          </Card>
        </div>
        <Card className="h-fit">
          <CardHeader><CardTitle>Compliance documents</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            {["GST Certificate", "PAN Card", "Cancelled Cheque", "MSME Certificate"].map((item) => (
              <Field key={item}>
                <Label>{item}</Label>
                <Input type="file" />
              </Field>
            ))}
            <div className="rounded-md border bg-muted/45 p-3 text-xs text-muted-foreground">
              Uploaded files are sanitized and stored through the API placeholder endpoint. Seed data marks documents as pending, verified, or rejected.
            </div>
            <Button>Submit Vendor</Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
