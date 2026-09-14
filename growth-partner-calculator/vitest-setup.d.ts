import "vitest";
import type { AssertionsResult } from "jest-axe";

interface AxeAssertions {
  toHaveNoViolations(): AssertionsResult;
}

declare module "vitest" {
  interface Assertion<T = unknown> extends AxeAssertions {}
  interface AsymmetricMatchersContaining extends AxeAssertions {}
}
