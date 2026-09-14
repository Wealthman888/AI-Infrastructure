"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal accessible modal built on the native <dialog> element — no extra
 * dependency needed for focus-trapping / Escape-to-close, browsers do it.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
      className={cn(
        "w-[min(28rem,90vw)] rounded-lg border border-border bg-navy-850 p-0 text-white backdrop:bg-black/60",
        className,
      )}
    >
      <div className="p-5">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
      </div>
    </dialog>
  );
}
