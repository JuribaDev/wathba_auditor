import { describe, expect, it } from "vitest";

import { getStepperState } from "@/components/ui/stepper";

describe("stepper state helper", () => {
  it("marks steps before the current index as done", () => {
    expect(getStepperState(0, 2)).toBe("done");
    expect(getStepperState(1, 2)).toBe("done");
  });

  it("marks the current index as active", () => {
    expect(getStepperState(2, 2)).toBe("active");
  });

  it("marks later steps as upcoming", () => {
    expect(getStepperState(3, 2)).toBe("upcoming");
    expect(getStepperState(4, 2)).toBe("upcoming");
  });
});
