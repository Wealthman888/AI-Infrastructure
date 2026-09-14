"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import { ScenarioResult, isAvailable } from "@/lib/calculations/types";
import { formatWhole, formatCount } from "@/lib/calculations/formatting";
import { FunnelMode } from "@/types/audit";
import { Alert } from "@/components/ui/alert";

const COLORS = ["#4f7cff", "#4670e0", "#3d63c2", "#3457a3", "#2b4a85", "#223d66"];

/**
 * A horizontal funnel rendered as a bar chart rather than Recharts'
 * dedicated Funnel component: with real-world ratios (tens of thousands of
 * impressions down to single-digit customers), Funnel's trapezoid geometry
 * collapses the lower stages into an illegible sliver. A log-scaled
 * horizontal bar keeps every stage readable while still reading top-to-
 * bottom as a funnel.
 */
export function FunnelVisualization({ result, mode }: { result: ScenarioResult; mode: FunnelMode }) {
  const fullStages = [
    { name: "Impressions", value: result.impressions, format: formatWhole },
    { name: "Clicks", value: result.clicks, format: formatCount },
    { name: "Leads", value: result.leadsOrPurchases, format: formatCount },
    { name: "Booked calls", value: result.bookedCalls, format: formatCount },
    { name: "Attended calls", value: result.attendedCalls, format: formatCount },
    { name: "Customers", value: result.newCustomers, format: formatCount },
  ];
  const directStages = [
    { name: "Impressions", value: result.impressions, format: formatWhole },
    { name: "Clicks", value: result.clicks, format: formatCount },
    { name: "Purchases", value: result.newCustomers, format: formatCount },
  ];
  const stages = mode === "direct" ? directStages : fullStages;

  if (stages.some((s) => !isAvailable(s.value))) {
    return (
      <Alert tone="info" title="Funnel visualization unavailable">
        Fill in advertising spend, CPM, and the conversion rates for this scenario to render the funnel.
      </Alert>
    );
  }

  const data = stages.map((s) => ({
    name: s.name,
    value: s.value as number,
    // A log scale keeps single-digit customer counts visible on the same axis as six-figure impressions.
    scaled: Math.log10(Math.max(1, s.value as number) + 1),
    display: s.format(s.value),
  }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 56, left: 8, bottom: 8 }} barCategoryGap="20%">
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis type="category" dataKey="name" width={110} stroke="#8a97ad" fontSize={13} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={((_value: unknown, _name: unknown, item: { payload: { display: string } }) => [item.payload.display, "Value"]) as never}
            contentStyle={{ background: "#131c2e", border: "1px solid #22304a", borderRadius: 8, color: "#fff" }}
          />
          <Bar dataKey="scaled" radius={[0, 4, 4, 0]} maxBarSize={36}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
            <LabelList dataKey="display" position="right" fill="#f4f6fb" fontSize={13} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
