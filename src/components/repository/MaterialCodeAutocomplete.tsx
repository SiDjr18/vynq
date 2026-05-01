import { KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { api, queryString } from "@/lib/api";
import type { Material } from "@/types";

type MaterialSuggestion = Pick<Material, "materialCode" | "materialName" | "category" | "subCategory" | "uom" | "regulatoryCategory" | "storageCondition" | "criticality" | "pharmaGrade" | "specification" | "hsnCode" | "shelfLifeMonths">;

type Props = {
  value?: string;
  onSelect: (material: MaterialSuggestion | null) => void;
  categoryFilter?: string;
  allowCreateNew?: boolean;
  placeholder?: string;
};

export function MaterialCodeAutocomplete({ value = "", onSelect, categoryFilter, allowCreateNew, placeholder = "Search 10-digit material code" }: Props) {
  const [query, setQuery] = useState(value);
  const [items, setItems] = useState<MaterialSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const canSearch = query.trim().length >= 2;

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    if (!canSearch) {
      setItems([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = await api<MaterialSuggestion[]>(`/materials/search?${queryString({ query, category: categoryFilter })}`);
        setItems(result);
        setOpen(true);
        setHighlighted(0);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [canSearch, categoryFilter, query]);

  const notFound = useMemo(() => canSearch && !loading && open && items.length === 0, [canSearch, items.length, loading, open]);

  function select(material: MaterialSuggestion) {
    setQuery(material.materialCode);
    setOpen(false);
    onSelect(material);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || !items.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((prev) => Math.min(prev + 1, items.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((prev) => Math.max(prev - 1, 0));
    }
    if (event.key === "Enter") {
      event.preventDefault();
      select(items[highlighted]);
    }
    if (event.key === "Escape") setOpen(false);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
        <Input
          className="pl-9 pr-10"
          value={query}
          placeholder={placeholder}
          onFocus={() => canSearch && setOpen(true)}
          onKeyDown={handleKeyDown}
          onChange={(event) => {
            setQuery(event.target.value);
            onSelect(null);
          }}
        />
        {loading ? <Loader2 className="absolute right-3 top-2.5 size-4 animate-spin text-muted-foreground" /> : null}
        {!loading && query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 size-8"
            onClick={() => {
              setQuery("");
              setOpen(false);
              onSelect(null);
            }}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      {open && (items.length > 0 || notFound) ? (
        <div className="absolute z-50 mt-2 max-h-80 w-full overflow-auto rounded-md border bg-card p-2 shadow-soft">
          {items.map((item, index) => (
            <button
              key={item.materialCode}
              type="button"
              className={`w-full rounded-md px-3 py-2 text-left text-xs transition ${highlighted === index ? "bg-accent" : "hover:bg-accent/70"}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => select(item)}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-primary">{item.materialCode}</span>
                <span className="font-medium">{item.materialName}</span>
                <Badge>{item.criticality}</Badge>
              </div>
              <div className="mt-1 text-muted-foreground">
                {item.category} / {item.subCategory} · {item.uom} · {item.regulatoryCategory} · {item.storageCondition}
              </div>
            </button>
          ))}
          {notFound ? (
            <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              Material code not found. {allowCreateNew ? "Create new material or select from repository." : "Select from repository."}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

