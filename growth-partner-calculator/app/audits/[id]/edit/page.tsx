"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AuditWizard } from "@/components/forms/audit-wizard";
import { getAudit, saveAudit } from "@/lib/storage/audits";
import { Audit } from "@/types/audit";
import { Alert } from "@/components/ui/alert";

export default function EditAuditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [audit, setAudit] = useState<Audit | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAudit(getAudit(params.id) ?? null);
  }, [params.id]);

  if (audit === undefined) {
    return <div className="h-64 animate-pulse rounded-lg bg-navy-800" />;
  }

  if (audit === null) {
    return <Alert tone="danger" title="Audit not found">This audit may have been deleted.</Alert>;
  }

  const handleSave = (updated: Audit) => {
    setSaving(true);
    const saved = saveAudit(updated);
    router.push(`/audits/${saved.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit audit — {audit.prospect.companyName || "Untitled"}</h1>
        <p className="text-sm text-muted-foreground">Update inputs, then save to recalculate projections.</p>
      </div>
      <AuditWizard initialAudit={audit} onSave={handleSave} saving={saving} />
    </div>
  );
}
