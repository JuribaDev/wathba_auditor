import { describe, expect, it } from "vitest";

import { findSkillById, listSkills } from "@/lib/skills/index";

describe("generated skills", () => {
  it("loads the seed ZATCA skill", () => {
    const skills = listSkills();
    expect(skills.length).toBeGreaterThan(0);

    const skill = findSkillById("saudi-zatca-phase2");
    expect(skill?.slug).toBe("zatca-phase2");
    expect(skill?.name.ar).toContain("زاتكا");
  });
});

