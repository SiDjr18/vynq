import { useState } from "react";
import { Database, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialCodeAutocomplete } from "./MaterialCodeAutocomplete";
import { MaterialDetailCard } from "./MaterialDetailCard";
import { ManufacturerSuggestionPanel } from "./ManufacturerSuggestionPanel";
import { VendorRecommendationPanel } from "./VendorRecommendationPanel";
import { SupplyHistoryPanel } from "./SupplyHistoryPanel";
import type { Material } from "@/types";

export function RepositoryLookupDrawer() {
  const [open, setOpen] = useState(false);
  const [material, setMaterial] = useState<Partial<Material> | null>(null);
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Database data-icon="inline-start" /> Repository Lookup
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/25">
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-background p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">CDMO / Pharma Repository Lookup</h2>
                <p className="text-sm text-muted-foreground">Search material codes, auto-capture details, and review supply history.</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="size-4" /></Button>
            </div>
            <div className="space-y-4">
              <MaterialCodeAutocomplete value={material?.materialCode || ""} onSelect={setMaterial} />
              <MaterialDetailCard material={material} />
              <ManufacturerSuggestionPanel materialCode={material?.materialCode} />
              <VendorRecommendationPanel materialCode={material?.materialCode} />
              <SupplyHistoryPanel materialCode={material?.materialCode} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
