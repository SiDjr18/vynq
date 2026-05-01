import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const tone: Record<string, string> = {
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Closed: "bg-slate-100 text-slate-700 ring-slate-200",
  Blocked: "bg-red-50 text-red-700 ring-red-200",
  Rejected: "bg-red-50 text-red-700 ring-red-200",
  "On Hold": "bg-amber-50 text-amber-700 ring-amber-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  "Quotations Pending": "bg-amber-50 text-amber-700 ring-amber-200",
  "QCS Approval Pending": "bg-amber-50 text-amber-700 ring-amber-200",
  "Negotiation Scheduled": "bg-sky-50 text-sky-700 ring-sky-200",
  "Negotiation Started": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "QCS Approved": "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Unapproved: "bg-slate-100 text-slate-700 ring-slate-200",
  Inactive: "bg-slate-100 text-slate-700 ring-slate-200"
};

export function Badge({ children, status, className }: { children: ReactNode; status?: string; className?: string }) {
  const key = status || String(children);
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", tone[key] || "bg-secondary text-secondary-foreground ring-border", className)}>
      {children}
    </span>
  );
}
