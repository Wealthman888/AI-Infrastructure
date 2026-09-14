"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import {
  AuditSearchFilters,
  deleteAudit,
  duplicateAudit,
  exportAuditsToJSON,
  importAuditsFromJSON,
  searchAudits,
  setAuditArchived,
} from "@/lib/storage/audits";
import { Audit, AUDIT_STATUS_OPTIONS } from "@/types/audit";
import { Copy, Archive, ArchiveRestore, Trash2, Download, Upload, Search } from "lucide-react";

export default function SavedAuditsPage() {
  const [audits, setAudits] = useState<Audit[] | null>(null);
  const [filters, setFilters] = useState<AuditSearchFilters>({ status: "all", includeArchived: false });
  const [pendingDelete, setPendingDelete] = useState<Audit | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setAudits(searchAudits(filters));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleExport = () => {
    const json = exportAuditsToJSON();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `growth-partner-audits-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    const result = importAuditsFromJSON(text);
    setImportMessage(
      `Imported ${result.importedCount} audit${result.importedCount === 1 ? "" : "s"}${result.skippedCount > 0 ? `, skipped ${result.skippedCount} invalid entr${result.skippedCount === 1 ? "y" : "ies"}` : ""}.`,
    );
    refresh();
  };

  if (!audits) return <div className="h-64 animate-pulse rounded-lg bg-navy-800" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Saved audits</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export JSON
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {importMessage && <Alert tone="info">{importMessage}</Alert>}

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-[220px] flex-1 space-y-1.5">
            <label className="text-sm text-muted-foreground" htmlFor="search">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                id="search"
                className="pl-9"
                placeholder="Company, contact, industry, source…"
                value={filters.query ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-muted-foreground" htmlFor="status-filter">Status</label>
            <Select
              id="status-filter"
              value={filters.status ?? "all"}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as AuditSearchFilters["status"] }))}
            >
              <option value="all">All statuses</option>
              {AUDIT_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={filters.includeArchived ?? false}
              onChange={(e) => setFilters((f) => ({ ...f, includeArchived: e.target.checked }))}
            />
            Include archived
          </label>
        </CardContent>
      </Card>

      {audits.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-muted-foreground">No audits match these filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {audits.map((audit) => (
            <Card key={audit.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <Link href={`/audits/${audit.id}`} className="min-w-[200px] flex-1">
                  <p className="font-medium text-white">{audit.prospect.companyName || "Untitled company"}</p>
                  <p className="text-sm text-muted-foreground">
                    {audit.prospect.prospectName} · {audit.prospect.industry || "—"} · {audit.prospect.sourcePlatform || "—"}
                  </p>
                  {audit.followUpDate && <p className="text-xs text-warning">Follow up: {audit.followUpDate}</p>}
                </Link>
                <Badge>{AUDIT_STATUS_OPTIONS.find((s) => s.value === audit.status)?.label}</Badge>
                <div className="flex gap-1.5">
                  <Link href={`/audits/${audit.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>Edit</Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      duplicateAudit(audit.id);
                      refresh();
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAuditArchived(audit.id, !audit.archived);
                      refresh();
                    }}
                  >
                    {audit.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                  </Button>
                  <Button type="button" variant="destructive" size="sm" onClick={() => setPendingDelete(audit)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete this audit?"
        description={pendingDelete ? `This permanently removes "${pendingDelete.prospect.companyName || "this audit"}". This cannot be undone.` : undefined}
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (pendingDelete) deleteAudit(pendingDelete.id);
              setPendingDelete(null);
              refresh();
            }}
          >
            Delete permanently
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
