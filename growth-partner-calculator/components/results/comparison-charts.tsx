"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScenarioKey, SCENARIO_LABELS } from "@/types/audit";
import { ScenarioResult, isAvailable } from "@/lib/calculations/types";
import { formatCurrency, formatRatio, formatCount } from "@/lib/calculations/formatting";

const POSITIVE = "#22a06b";
const NEGATIVE = "#d3453f";
const NEUTRAL_GRAY = "#3d4a63";

type NumericMetricKey = "netAttributedRevenue" | "contributionAfterMarketing" | "netROAS" | "newCustomers";

function MiniBarChart({
  title,
  scenarios,
  results,
  metricKey,
  formatter,
}: {
  title: string;
  scenarios: ScenarioKey[];
  results: Record<ScenarioKey, ScenarioResult>;
  metricKey: NumericMetricKey;
  formatter: (v: number) => string;
}) {
  const data = scenarios.map((key) => {
    const result = results[key];
    const metric = result[metricKey];
    const contribution = result.contributionAfterMarketing;
    const negative = isAvailable(contribution) && contribution < 0;
    return {
      name: SCENARIO_LABELS[key],
      value: isAvailable(metric) ? (metric as number) : 0,
      available: isAvailable(metric),
      display: isAvailable(metric) ? formatter(metric as number) : "Unavailable",
      negative,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1b2740" vertical={false} />
            <XAxis dataKey="name" stroke="#8a97ad" fontSize={12} tickLine={false} />
            <YAxis stroke="#8a97ad" fontSize={12} tickLine={false} axisLine={false} width={40} />
            <Tooltip
              formatter={((_value: unknown, _name: unknown, item: { payload: { display: string } }) => [item.payload.display, ""]) as never}
              contentStyle={{ background: "#131c2e", border: "1px solid #22304a", borderRadius: 8, color: "#fff" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {data.map((d, i) => (
                <Cell key={i} fill={!d.available ? NEUTRAL_GRAY : d.negative ? NEGATIVE : POSITIVE} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ComparisonCharts({
  results,
  includeCurrent,
}: {
  results: Record<ScenarioKey, ScenarioResult>;
  includeCurrent: boolean;
}) {
  const scenarios: ScenarioKey[] = includeCurrent
    ? ["current", "conservative", "expected", "best_case"]
    : ["conservative", "expected", "best_case"];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <MiniBarChart title="Net attributed revenue" scenarios={scenarios} results={results} metricKey="netAttributedRevenue" formatter={(v) => formatCurrency(v)} />
      <MiniBarChart title="Contribution after marketing" scenarios={scenarios} results={results} metricKey="contributionAfterMarketing" formatter={(v) => formatCurrency(v)} />
      <MiniBarChart title="Net ROAS" scenarios={scenarios} results={results} metricKey="netROAS" formatter={(v) => formatRatio(v)} />
      <MiniBarChart title="New customers" scenarios={scenarios} results={results} metricKey="newCustomers" formatter={(v) => formatCount(v)} />
    </div>
  );
}
