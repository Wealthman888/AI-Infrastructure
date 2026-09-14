/**
 * Every form field gets an accessible description, linked via
 * aria-describedby: the author-provided hint when there is one, otherwise a
 * generic fallback so screen-reader users always get *something* — visually
 * hidden in the fallback case so sighted users see no extra clutter.
 */
export function FieldDescription({ id, hint, fallback }: { id: string; hint?: string; fallback: string }) {
  if (hint) {
    return (
      <p id={id} className="text-xs text-muted-foreground">
        {hint}
      </p>
    );
  }
  return (
    <span id={id} className="sr-only">
      {fallback}
    </span>
  );
}

export function FieldErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-danger">
      {message}
    </p>
  );
}

/** Builds the aria-describedby value: the description id, plus the error id when an error is present. */
export function describedByIds(name: string, hasError: boolean): string {
  return hasError ? `${name}-description ${name}-error` : `${name}-description`;
}
