"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { computeDashboardMetrics, DashboardMetrics } from "@/lib/dashboard";
import { AUDIT_STATUS_OPTIONS } from "@/types/audit";
import { formatCurrency } from "@/lib/calculations/formatting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    setMetrics(computeDashboardMetrics());
  }, []);

  if (!metrics) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-navy-800" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-navy-800" />
          ))}
        </div>
      </div>
    );
  }

  if (metrics.auditsCreated === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-navy-850 py-24 text-center">
        <h1 className="text-xl font-semibold">No audits yet</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Create your first growth-partner audit to see pipeline metrics, projected revenue, and qualification
          scoring here.
        </p>
        <Link href="/audits/new" className={buttonVariants({ variant: "default" })}>
          <PlusCircle className="h-4 w-4" /> New Audit
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Pipeline overview across all saved audits.</p>
        </div>
        <Link href="/audits/new" className={buttonVariants({ variant: "default" })}>
          <PlusCircle className="h-4 w-4" /> New Audit
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Audits created" value={metrics.auditsCreated} />
        <MetricCard label="Qualified prospects" value={metrics.qualifiedProspects} />
        <MetricCard label="Calls booked" value={metrics.callsBooked} />
        <MetricCard label="Clients closed" value={metrics.clientsClosed} />
        <MetricCard label="Total projected client revenue" value={formatCurrency(metrics.totalProjectedClientRevenue)} />
        <MetricCard label="Total proposed management fees" value={formatCurrency(metrics.totalProposedManagementFees)} />
        <MetricCard label="Total proposed performance compensation" value={formatCurrency(metrics.totalProposedPerformanceCompensation)} />
      </div>
      <p className="text-xs text-muted-foreground">
        Revenue and fee totals use each audit&apos;s expected-case scenario. They are planning estimates, not
        guaranteed results.
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent audits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.recentAudits.map((audit) => (
              <Link
                key={audit.id}
                href={`/audits/${audit.id}`}
                className="flex items-center justify-between rounded-md border border-border p-3 text-sm hover:bg-navy-800"
              >
                <div>
                  <p className="font-medium text-white">{audit.prospect.companyName || "Untitled company"}</p>
                  <p className="text-muted-foreground">{audit.prospect.prospectName || "No contact name"}</p>
                </div>
                <Badge>{AUDIT_STATUS_OPTIONS.find((s) => s.value === audit.status)?.label}</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {AUDIT_STATUS_OPTIONS.map((option) => {
              const count = metrics.pipeline.find((p) => p.status === option.value)?.count ?? 0;
              if (count === 0) return null;
              return (
                <div key={option.value} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{option.label}</span>
                  <span className="font-medium text-white">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
