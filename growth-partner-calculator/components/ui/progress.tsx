import { cn } from "@/lib/utils";

export function Progress({ value, className, tone = "brand" }: { value: number; className?: string; tone?: "brand" | "positive" | "warning" | "danger" }) {
  const clamped = Math.max(0, Math.min(100, value));
  const toneClass = {
    brand: "bg-brand-blue",
    positive: "bg-positive",
    warning: "bg-warning",
    danger: "bg-danger",
  }[tone];
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-navy-700", className)}
    >
      <div className={cn("h-full rounded-full transition-all", toneClass)} style={{ width: `${clamped}%` }} />
    </div>
  );
}
