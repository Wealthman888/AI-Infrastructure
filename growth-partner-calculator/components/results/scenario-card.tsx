import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScenarioResult, isAvailable } from "@/lib/calculations/types";
import { formatCurrency, formatCount, formatPercent, formatRatio, formatWhole } from "@/lib/calculations/formatting";
import { EconomicStatusBadge } from "./status-badge";

function Row({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={tone === "positive" ? "font-medium text-positive" : tone === "negative" ? "font-medium text-danger" : "font-medium text-white"}>
        {value}
      </span>
    </div>
  );
}

export function ScenarioCard({ label, result }: { label: string; result: ScenarioResult }) {
  const contributionTone = isAvailable(result.contributionAfterMarketing)
    ? result.contributionAfterMarketing >= 0
      ? "positive"
      : "negative"
    : undefined;

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{label}</CardTitle>
        <EconomicStatusBadge status={result.economicStatus} />
      </CardHeader>
      <CardContent className="divide-y divide-border/60">
        <Row label="Advertising spend" value={formatCurrency(result.adSpend)} />
        <Row label="Impressions" value={formatWhole(result.impressions)} />
        <Row label="Clicks" value={formatCount(result.clicks)} />
        <Row label="Leads / purchases" value={formatCount(result.leadsOrPurchases)} />
        <Row label="Booked calls" value={formatCount(result.bookedCalls)} />
        <Row label="Attended calls" value={formatCount(result.attendedCalls)} />
        <Row label="New customers" value={formatCount(result.newCustomers)} />
        <Row label="Gross attributed revenue" value={formatCurrency(result.grossAttributedRevenue)} />
        <Row label="Net attributed revenue" value={formatCurrency(result.netAttributedRevenue)} />
        <Row label="Gross profit" value={formatCurrency(result.grossProfitBeforeMarketing)} />
        <Row label="Performance fee" value={formatCurrency(result.performanceFee)} />
        <Row label="Contribution after marketing" value={formatCurrency(result.contributionAfterMarketing)} tone={contributionTone} />
        <Row label="Customer-acquisition cost" value={formatCurrency(result.cac)} />
        <Row label="Net ROAS" value={formatRatio(result.netROAS)} />
        <Row label="Break-even customers" value={formatCount(result.breakEvenCustomers)} />
        <Row label="Capacity utilization" value={formatPercent(result.capacityUtilization)} />
      </CardContent>
    </Card>
  );
}
