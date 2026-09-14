import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScenarioResult, isAvailable } from "@/lib/calculations/types";
import { formatCurrency, formatCount, formatRatio } from "@/lib/calculations/formatting";
import { EconomicStatusBadge } from "@/components/results/status-badge";

export function ClientScenarioCard({ label, result }: { label: string; result: ScenarioResult }) {
  const tone = isAvailable(result.contributionAfterMarketing)
    ? result.contributionAfterMarketing >= 0
      ? "text-positive"
      : "text-danger"
    : "text-muted";
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{label}</CardTitle>
        <EconomicStatusBadge status={result.economicStatus} />
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Advertising spend</span>
          <span className="text-white">{formatCurrency(result.adSpend)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">New customers</span>
          <span className="text-white">{formatCount(result.newCustomers)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Net attributed revenue</span>
          <span className="text-white">{formatCurrency(result.netAttributedRevenue)}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span className="text-muted-foreground">Contribution after marketing</span>
          <span className={tone}>{formatCurrency(result.contributionAfterMarketing)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Net ROAS</span>
          <span className="text-white">{formatRatio(result.netROAS)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
