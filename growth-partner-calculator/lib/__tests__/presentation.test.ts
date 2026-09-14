import { describe, expect, it } from "vitest";
import { allConfirmedInputsVerified, buildConfirmedInputs } from "../presentation";
import { createEmptyAudit } from "@/lib/audit-factory";
import { trackedValue } from "@/types/audit";

describe("buildConfirmedInputs", () => {
  it("shows the true status of every displayed metric, not just the reliable ones", () => {
    const audit = createEmptyAudit();
    audit.economics.averageCollectedSale = trackedValue(5000, "verified");
    audit.economics.grossMarginPercent = trackedValue(0.8, "client_provided");
    audit.economics.currentMonthlyCollectedRevenue = trackedValue(40000, "estimated");
    // existingMonthlyAdSpend left at default "missing" status with no value.

    const rows = buildConfirmedInputs(audit);
    const findRow = (label: string) => {
      const row = rows.find((r) => r.label === label);
      if (!row) throw new Error(`Expected a row labeled "${label}"`);
      return row;
    };

    expect(findRow("Average collected sale").status).toBe("verified");
    expect(findRow("Average collected sale").statusLabel).toBe("Verified");
    expect(findRow("Gross margin").status).toBe("client_provided");
    expect(findRow("Gross margin").statusLabel).toBe("Client provided");
    expect(findRow("Current monthly revenue").status).toBe("estimated");
    expect(findRow("Existing monthly ad spend").status).toBe("missing");
    expect(findRow("Existing monthly ad spend").formatted).toBe("Not provided");
  });

  it("marks allConfirmedInputsVerified true only when every displayed metric is status verified", () => {
    const audit = createEmptyAudit();
    audit.economics.averageCollectedSale = trackedValue(5000, "verified");
    audit.economics.grossMarginPercent = trackedValue(0.8, "verified");
    audit.economics.currentMonthlyCollectedRevenue = trackedValue(40000, "verified");
    audit.economics.existingMonthlyAdSpend = trackedValue(4000, "verified");

    expect(allConfirmedInputsVerified(buildConfirmedInputs(audit))).toBe(true);

    audit.economics.existingMonthlyAdSpend = trackedValue(4000, "client_provided");
    expect(allConfirmedInputsVerified(buildConfirmedInputs(audit))).toBe(false);
  });

  it("is false for a completely empty audit (nothing verified)", () => {
    const audit = createEmptyAudit();
    expect(allConfirmedInputsVerified(buildConfirmedInputs(audit))).toBe(false);
  });
});
