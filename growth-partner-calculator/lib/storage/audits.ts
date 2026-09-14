import { Audit, AuditStatus } from "@/types/audit";
import { auditImportSchema } from "@/lib/validation/schemas";

const STORAGE_KEY = "gpc:audits:v1";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readAll(): Audit[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Audit[];
  } catch {
    return [];
  }
}

function writeAll(audits: Audit[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(audits));
}

export function listAudits(): Audit[] {
  return readAll().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getAudit(id: string): Audit | undefined {
  return readAll().find((a) => a.id === id);
}

export function saveAudit(audit: Audit): Audit {
  const audits = readAll();
  const updated: Audit = { ...audit, updatedAt: new Date().toISOString() };
  const index = audits.findIndex((a) => a.id === audit.id);
  if (index >= 0) {
    audits[index] = updated;
  } else {
    audits.push(updated);
  }
  writeAll(audits);
  return updated;
}

export function deleteAudit(id: string): void {
  writeAll(readAll().filter((a) => a.id !== id));
}

export function duplicateAudit(id: string): Audit | undefined {
  const source = getAudit(id);
  if (!source) return undefined;
  const now = new Date().toISOString();
  const copy: Audit = {
    ...source,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `audit_${Date.now()}`,
    prospect: { ...source.prospect, companyName: `${source.prospect.companyName} (Copy)` },
    status: "researching",
    createdAt: now,
    updatedAt: now,
    archived: false,
    callStatus: "not_scheduled",
    proposalStatus: "not_sent",
    outcome: "pending",
    followUpDate: null,
  };
  const audits = readAll();
  audits.push(copy);
  writeAll(audits);
  return copy;
}

export function setAuditArchived(id: string, archived: boolean): void {
  const audits = readAll();
  const index = audits.findIndex((a) => a.id === id);
  if (index < 0) return;
  const existing = audits[index]!;
  audits[index] = {
    ...existing,
    archived,
    status: archived ? "archived" : existing.status === "archived" ? "researching" : existing.status,
    updatedAt: new Date().toISOString(),
  };
  writeAll(audits);
}

export interface AuditSearchFilters {
  query?: string;
  status?: AuditStatus | "all";
  industry?: string;
  sourcePlatform?: string;
  includeArchived?: boolean;
}

export function searchAudits(filters: AuditSearchFilters): Audit[] {
  const { query, status, industry, sourcePlatform, includeArchived } = filters;
  const q = query?.trim().toLowerCase();
  return listAudits().filter((audit) => {
    if (!includeArchived && audit.archived) return false;
    if (status && status !== "all" && audit.status !== status) return false;
    if (industry && audit.prospect.industry !== industry) return false;
    if (sourcePlatform && audit.prospect.sourcePlatform !== sourcePlatform) return false;
    if (q) {
      const haystack = [
        audit.prospect.companyName,
        audit.prospect.prospectName,
        audit.prospect.industry,
        audit.prospect.sourcePlatform,
        audit.prospect.website,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function exportAuditsToJSON(ids?: string[]): string {
  const audits = ids ? readAll().filter((a) => ids.includes(a.id)) : readAll();
  return JSON.stringify(audits, null, 2);
}

export interface ImportResult {
  importedCount: number;
  skippedCount: number;
  errors: string[];
}

/** Sanitizes and imports a JSON export. Existing audits with the same id are overwritten; malformed entries are skipped, not thrown. */
export function importAuditsFromJSON(json: string): ImportResult {
  const errors: string[] = [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { importedCount: 0, skippedCount: 0, errors: ["File is not valid JSON."] };
  }

  const candidates = Array.isArray(parsed) ? parsed : [parsed];
  const audits = readAll();
  let importedCount = 0;
  let skippedCount = 0;

  for (const candidate of candidates) {
    const result = auditImportSchema.safeParse(candidate);
    if (!result.success) {
      skippedCount += 1;
      errors.push(`Skipped one entry: ${result.error.issues[0]?.message ?? "invalid audit shape"}`);
      continue;
    }
    const validAudits = Array.isArray(result.data) ? result.data : [result.data];
    for (const audit of validAudits) {
      const index = audits.findIndex((a) => a.id === audit.id);
      if (index >= 0) audits[index] = audit;
      else audits.push(audit);
      importedCount += 1;
    }
  }

  writeAll(audits);
  return { importedCount, skippedCount, errors };
}
