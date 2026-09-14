"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Audit,
  AUDIT_STATUS_OPTIONS,
  AuditStatus,
  CallStatus,
  Outcome,
  ProposalStatus,
} from "@/types/audit";
import { deleteAudit, duplicateAudit, saveAudit, setAuditArchived } from "@/lib/storage/audits";
import { Pencil, Copy, Archive, ArchiveRestore, Trash2, Presentation, PhoneCall } from "lucide-react";

const CALL_STATUS_OPTIONS: { value: CallStatus; label: string }[] = [
  { value: "not_scheduled", label: "Not scheduled" },
  { value: "scheduled", label: "Scheduled" },
  { value: "completed", label: "Completed" },
  { value: "no_show", label: "No-show" },
  { value: "rescheduled", label: "Rescheduled" },
];

const PROPOSAL_STATUS_OPTIONS: { value: ProposalStatus; label: string }[] = [
  { value: "not_sent", label: "Not sent" },
  { value: "sent", label: "Sent" },
  { value: "under_review", label: "Under review" },
  { value: "accepted", label: "Accepted" },
  { value: "declined", label: "Declined" },
];

const OUTCOME_OPTIONS: { value: Outcome; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "closed_won", label: "Closed won" },
  { value: "closed_lost", label: "Closed lost" },
  { value: "nurture", label: "Nurture" },
];

export function ActionBar({ audit, onChange }: { audit: Audit; onChange: (audit: Audit) => void }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = (partial: Partial<Audit>) => {
    onChange(saveAudit({ ...audit, ...partial }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link href={`/audits/${audit.id}/edit`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Link>
        <Link href={`/audits/${audit.id}/present`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          <Presentation className="h-3.5 w-3.5" /> Presentation mode
        </Link>
        <Link href={`/audits/${audit.id}/call`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
          <PhoneCall className="h-3.5 w-3.5" /> Sales-call mode
        </Link>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const copy = duplicateAudit(audit.id);
            if (copy) router.push(`/audits/${copy.id}`);
          }}
        >
          <Copy className="h-3.5 w-3.5" /> Duplicate
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setAuditArchived(audit.id, !audit.archived);
            onChange({ ...audit, archived: !audit.archived });
          }}
        >
          {audit.archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          {audit.archived ? "Unarchive" : "Archive"}
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border border-border bg-navy-850 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label htmlFor="audit-status">Pipeline status</Label>
          <Select id="audit-status" value={audit.status} onChange={(e) => update({ status: e.target.value as AuditStatus })}>
            {AUDIT_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="call-status">Call status</Label>
          <Select id="call-status" value={audit.callStatus} onChange={(e) => update({ callStatus: e.target.value as CallStatus })}>
            {CALL_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="proposal-status">Proposal status</Label>
          <Select id="proposal-status" value={audit.proposalStatus} onChange={(e) => update({ proposalStatus: e.target.value as ProposalStatus })}>
            {PROPOSAL_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="outcome">Outcome</Label>
          <Select id="outcome" value={audit.outcome} onChange={(e) => update({ outcome: e.target.value as Outcome })}>
            {OUTCOME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="follow-up">Follow-up date</Label>
          <Input
            id="follow-up"
            type="date"
            value={audit.followUpDate ?? ""}
            onChange={(e) => update({ followUpDate: e.target.value || null })}
          />
        </div>
      </div>

      <Dialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this audit?"
        description="This permanently removes the audit and its AI analysis. This cannot be undone."
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              deleteAudit(audit.id);
              router.push("/audits");
            }}
          >
            Delete permanently
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
