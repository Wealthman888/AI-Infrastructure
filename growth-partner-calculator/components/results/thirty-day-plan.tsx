import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Audit } from "@/types/audit";
import { buildThirtyDayPlan } from "@/lib/thirty-day-plan";

export function ThirtyDayPlan({ audit }: { audit: Audit }) {
  const phases = buildThirtyDayPlan(audit);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalized 30-day plan</CardTitle>
        <CardDescription>Generated from this audit&apos;s bottlenecks and missing prerequisites.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {phases.map((phase) => (
          <div key={phase.range} className="rounded-md border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-blue">{phase.range}</p>
            <p className="mt-0.5 text-sm font-medium text-white">{phase.title}</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
              {phase.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
