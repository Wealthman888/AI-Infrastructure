import * as React from "react";
import { AlertTriangle, Info, XCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const toneStyles = {
  info: { wrap: "border-border bg-navy-800 text-muted-foreground", Icon: Info },
  warning: { wrap: "border-warning-border bg-warning-bg text-warning", Icon: AlertTriangle },
  danger: { wrap: "border-danger-border bg-danger-bg text-danger", Icon: XCircle },
  positive: { wrap: "border-positive-border bg-positive-bg text-positive", Icon: CheckCircle2 },
} as const;

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: keyof typeof toneStyles;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const { wrap, Icon } = toneStyles[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-md border p-3 text-sm", wrap, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="mt-0.5 text-sm opacity-90">{children}</div>}
      </div>
    </div>
  );
}
