import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InputStatus } from "@/types/audit";
import { ConfirmedInputRow, allConfirmedInputsVerified } from "@/lib/presentation";

const STATUS_BADGE_VARIANT: Record<InputStatus, "positive" | "default" | "warning" | "danger"> = {
  verified: "positive",
  client_provided: "default",
  publicly_observed: "default",
  estimated: "warning",
  missing: "danger",
};

export function ConfirmedInputsCard({ rows }: { rows: ConfirmedInputRow[] }) {
  const allVerified = allConfirmedInputsVerified(rows);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Confirmed business inputs</CardTitle>
        {allVerified && <Badge variant="positive">Verified baseline</Badge>}
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="flex items-center gap-2">
                <span className="text-white">{row.formatted}</span>
                <Badge variant={STATUS_BADGE_VARIANT[row.status]}>{row.statusLabel}</Badge>
              </span>
            </div>
          ))}
        </div>
        {!allVerified && (
          <p className="mt-3 text-xs text-muted-foreground">
            Figures not marked &quot;Verified&quot; are client-provided, publicly observed, estimated, or missing —
            we recommend confirming them before the pilot begins.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
