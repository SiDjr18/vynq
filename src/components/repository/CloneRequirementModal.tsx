import { useState } from "react";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function CloneRequirementModal({ requirementId, onCloned }: { requirementId: string; onCloned?: () => void }) {
  const [open, setOpen] = useState(false);
  const [cloneVendors, setCloneVendors] = useState(true);
  const [cloneTerms, setCloneTerms] = useState(true);
  const [cloneTemplateQuestions, setCloneTemplateQuestions] = useState(true);
  const [cloneOnlyMaterialLineItems, setCloneOnlyMaterialLineItems] = useState(false);

  async function clone() {
    const result = await api<{ message: string; redirectTo: string }>(`/requirements/${requirementId}/clone`, {
      method: "POST",
      body: JSON.stringify({ cloneVendors, cloneTerms, cloneTemplateQuestions, cloneOnlyMaterialLineItems })
    });
    toast.success(result.message);
    setOpen(false);
    onCloned?.();
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Copy data-icon="inline-start" /> Clone
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-5 shadow-soft">
            <h2 className="text-lg font-semibold">Do you want to clone this requirement?</h2>
            <div className="mt-4 space-y-3 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={cloneVendors} onChange={(event) => setCloneVendors(event.target.checked)} /> Clone with vendors</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={cloneTerms} onChange={(event) => setCloneTerms(event.target.checked)} /> Clone delivery and payment terms</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={cloneTemplateQuestions} onChange={(event) => setCloneTemplateQuestions(event.target.checked)} /> Clone quotation template questions</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={cloneOnlyMaterialLineItems} onChange={(event) => setCloneOnlyMaterialLineItems(event.target.checked)} /> Clone only material line items</label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" onClick={clone}>Clone Requirement</Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

