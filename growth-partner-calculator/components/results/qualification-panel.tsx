import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QualificationResult } from "@/lib/calculations/qualification";

export function QualificationPanel({ result }: { result: QualificationResult }) {
  const tone = result.tier === "qualified" ? "positive" : result.tier === "nurture" ? "warning" : "danger";
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Prospect qualification score</CardTitle>
          <CardDescription>{result.recommendation}</CardDescription>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-white">
            {result.totalScore}
            <span className="text-sm text-muted-foreground">/{result.maxScore}</span>
          </p>
          <Badge variant={tone}>{result.tierLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {result.criteria.map((c) => (
          <div key={c.key} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {c.label}
              {c.basis === "derived" && <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted">from data</span>}
            </span>
            <span className="font-medium text-white">
              {c.points}/{c.maxPoints}
            </span>
          </div>
        ))}
        {!result.performanceBasedEligible && (
          <div className="mt-3 rounded-md border border-warning-border bg-warning-bg p-3 text-xs text-warning">
            <p className="font-medium">Performance-based compensation not yet recommended:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {result.performanceBasedBlockers.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
