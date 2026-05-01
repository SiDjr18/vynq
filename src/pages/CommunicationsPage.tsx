import { MessageSquare, Send } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Label, Select, Textarea } from "@/components/ui/form";

export function CommunicationsPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Communications" description="Vendor and internal procurement communication workspace." />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader><CardTitle>Channels</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            {["RFQ clarifications", "Vendor onboarding", "PO acknowledgements", "Contract renewals"].map((item) => (
              <div key={item} className="flex items-center gap-2 rounded-md border bg-background p-3 text-sm">
                <MessageSquare data-icon="inline-start" /> {item}
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>New Message</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field><Label>Context</Label><Select><option>RFQ clarification</option><option>Vendor follow-up</option><option>PO acknowledgement</option></Select></Field>
            <Field><Label>Message</Label><Textarea placeholder="Type a procurement-safe message for the selected workflow." /></Field>
            <Button className="w-fit"><Send data-icon="inline-start" /> Send Message</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
