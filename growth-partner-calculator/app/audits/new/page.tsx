"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuditWizard } from "@/components/forms/audit-wizard";
import { createEmptyAudit } from "@/lib/audit-factory";
import { saveAudit } from "@/lib/storage/audits";
import { Audit } from "@/types/audit";

export default function NewAuditPage() {
  const router = useRouter();
  const [initialAudit] = useState<Audit>(() => createEmptyAudit());
  const [saving, setSaving] = useState(false);

  const handleSave = (audit: Audit) => {
    setSaving(true);
    const saved = saveAudit(audit);
    router.push(`/audits/${saved.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New audit</h1>
        <p className="text-sm text-muted-foreground">Walk through all five steps, then save to generate projections.</p>
      </div>
      <AuditWizard initialAudit={initialAudit} onSave={handleSave} saving={saving} />
    </div>
  );
}
