// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { auditFormSchema, AuditFormValues } from "@/lib/validation/schemas";
import { createEmptyAudit } from "@/lib/audit-factory";
import { formValuesFromAudit } from "../audit-wizard";
import { Step1Prospect } from "../step1-prospect";
import { Step4Scenarios } from "../step4-scenarios";
import { Step5Findings } from "../step5-findings";

expect.extend(toHaveNoViolations);

// These tests render one wizard step in isolation, not the full page, so
// page-level landmark/region rules (which assume a complete document) would
// false-positive here; they're covered separately by the page shell. Every
// other rule — labels, names, descriptions, duplicate ids — stays on.
const AXE_OPTIONS = { rules: { region: { enabled: false }, "landmark-one-main": { enabled: false } } };

function TestForm({ children }: { children: React.ReactNode }) {
  const methods = useForm<AuditFormValues>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: formValuesFromAudit(createEmptyAudit()),
  });
  return <FormProvider {...methods}>{children}</FormProvider>;
}

/** Every labelable form control must resolve to a non-empty accessible name — either an aria-label or an associated <label>. */
function assertEveryFieldHasAnAccessibleName(container: HTMLElement) {
  const controls = container.querySelectorAll("input, select, textarea");
  expect(controls.length).toBeGreaterThan(0);
  for (const control of Array.from(controls)) {
    const ariaLabel = control.getAttribute("aria-label");
    const labels = (control as HTMLInputElement).labels;
    const hasAssociatedLabel = !!labels && labels.length > 0 && Array.from(labels).some((l) => l.textContent?.trim());
    const hasAccessibleName = (!!ariaLabel && ariaLabel.trim().length > 0) || hasAssociatedLabel;
    expect(hasAccessibleName, `Field missing an accessible name: ${control.outerHTML.slice(0, 120)}`).toBe(true);
  }
}

/** Every field must be linked to some accessible description via aria-describedby, and that id must resolve to a real element. */
function assertEveryFieldHasAccessibleDescription(container: HTMLElement) {
  const controls = container.querySelectorAll("input, select, textarea");
  for (const control of Array.from(controls)) {
    const describedBy = control.getAttribute("aria-describedby");
    expect(describedBy, `Field missing aria-describedby: ${control.outerHTML.slice(0, 120)}`).toBeTruthy();
    for (const id of describedBy!.split(" ")) {
      // Attribute-selector form avoids needing CSS.escape for ids containing dots (e.g. "economics.averageCollectedSale-description").
      expect(container.querySelector(`[id="${id}"]`), `aria-describedby target #${id} not found`).not.toBeNull();
    }
  }
}

describe("Audit form accessibility", () => {
  it("Step 1 (Prospect information) has no automatically detectable a11y violations", async () => {
    const { container } = render(
      <TestForm>
        <Step1Prospect />
      </TestForm>,
    );
    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
    assertEveryFieldHasAnAccessibleName(container);
    assertEveryFieldHasAccessibleDescription(container);
  });

  it("Step 4 (Scenario assumptions) has no automatically detectable a11y violations", async () => {
    const { container } = render(
      <TestForm>
        <Step4Scenarios />
      </TestForm>,
    );
    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
    assertEveryFieldHasAnAccessibleName(container);
    assertEveryFieldHasAccessibleDescription(container);
  });

  it("Step 5 (Findings + staged spend) has no automatically detectable a11y violations", async () => {
    const { container } = render(
      <TestForm>
        <Step5Findings />
      </TestForm>,
    );
    const results = await axe(container, AXE_OPTIONS);
    expect(results).toHaveNoViolations();
    assertEveryFieldHasAnAccessibleName(container);
  });

  it("includes the scenario name in each scenario field's accessible name", () => {
    const { container } = render(
      <TestForm>
        <Step4Scenarios />
      </TestForm>,
    );
    const cpmInputs = Array.from(container.querySelectorAll('input[aria-label*="CPM"]'));
    expect(cpmInputs.length).toBeGreaterThanOrEqual(3);
    const labels = cpmInputs.map((el) => el.getAttribute("aria-label"));
    expect(labels.some((l) => l?.startsWith("Conservative"))).toBe(true);
    expect(labels.some((l) => l?.startsWith("Expected"))).toBe(true);
    expect(labels.some((l) => l?.startsWith("Best case"))).toBe(true);
  });

  it("gives every scenario input a unique id across tiers", () => {
    const { container } = render(
      <TestForm>
        <Step4Scenarios />
      </TestForm>,
    );
    const ids = Array.from(container.querySelectorAll("input[id], select[id]")).map((el) => el.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
