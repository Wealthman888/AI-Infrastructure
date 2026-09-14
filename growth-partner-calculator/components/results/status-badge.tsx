import { Badge } from "@/components/ui/badge";
import { ECONOMIC_STATUS_LABELS, ECONOMIC_STATUS_TONE, EconomicStatus } from "@/lib/calculations/types";

export function EconomicStatusBadge({ status }: { status: EconomicStatus }) {
  const tone = ECONOMIC_STATUS_TONE[status];
  const variant = tone === "positive" ? "positive" : tone === "negative" ? "danger" : tone === "warning" ? "warning" : "default";
  return <Badge variant={variant}>{ECONOMIC_STATUS_LABELS[status]}</Badge>;
}
