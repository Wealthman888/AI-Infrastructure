import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { BusinessModel, FunnelMode } from "@/types/audit";
import { resolveFormFunnelMode } from "./funnel-mode";

const TRACKED_FORCE_PATHS = ["funnel.leadToBookedCallRate", "funnel.showRate", "funnel.closeRate"];
const SCENARIO_FORCE_PATHS = ["current", "conservative", "expected", "best_case"].flatMap((tier) => [
  `scenarios.${tier}.leadToBookedCallRate`,
  `scenarios.${tier}.showRate`,
  `scenarios.${tier}.closeRate`,
]);

/**
 * Always-mounted at the wizard root so switching to a direct-purchase
 * business model forces the call-funnel rates to 100% even if the user
 * never visits Step 3 or Step 4 directly.
 */
export function useForceDirectFunnelValues() {
  const { control, setValue, getValues } = useFormContext();
  const businessModel: BusinessModel = useWatch({ control, name: "prospect.businessModel" });
  const override: FunnelMode | null = useWatch({ control, name: "funnelModeOverride" });
  const mode = resolveFormFunnelMode(businessModel, override);

  useEffect(() => {
    if (mode !== "direct") return;
    for (const path of TRACKED_FORCE_PATHS) {
      const valuePath = `${path}.value`;
      if (getValues(valuePath) !== 1) setValue(valuePath, 1, { shouldDirty: false });
      const statusPath = `${path}.status`;
      if (getValues(statusPath) === "missing") setValue(statusPath, "estimated", { shouldDirty: false });
    }
    for (const path of SCENARIO_FORCE_PATHS) {
      if (getValues(path) !== 1) setValue(path, 1, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  return mode;
}
