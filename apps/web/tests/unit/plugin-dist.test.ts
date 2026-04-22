import { describe, expect, it } from "vitest";

import {
  buildSkillMarkdown,
  clampDescription,
  findSlugCollisions,
  formatFrontmatterValue,
  renderPluginSkill,
  stableStringify,
} from "../../../../scripts/lib/plugin-dist";
import type { GeneratedSkill } from "@/lib/skills/generated";

function makeSkill(
  overrides: Partial<GeneratedSkill> & Pick<GeneratedSkill, "id" | "slug">,
): GeneratedSkill {
  const { id, slug, ...rest } = overrides;
  return {
    id,
    name: { en: id, ar: id },
    summary: { en: `${id} summary`, ar: `${id} ملخص` },
    slug,
    previousIds: [],
    lifecycle: "active",
    replacementId: null,
    sunsetDate: null,
    lifecycleNote: null,
    version: "0.1.0",
    category: "architecture",
    region: null,
    targets: ["claude-code"],
    status: "draft",
    lastVerified: "2026-01-01",
    maintainers: [],
    sources: [],
    disclaimer: false,
    variables: [],
    triggers: [],
    body: "# Heading\n\nbody",
    directory: slug,
    files: [],
    references: [],
    scripts: [],
    ...rest,
  };
}

describe("plugin-dist helpers", () => {
  describe("findSlugCollisions", () => {
    it("returns empty when slugs are unique", () => {
      const skills = [
        makeSkill({ id: "a", slug: "alpha" }),
        makeSkill({ id: "b", slug: "bravo" }),
      ];
      expect(findSlugCollisions(skills)).toEqual([]);
    });

    it("surfaces all skill ids sharing a slug", () => {
      const skills = [
        makeSkill({ id: "one", slug: "dup" }),
        makeSkill({ id: "two", slug: "dup" }),
        makeSkill({ id: "three", slug: "solo" }),
      ];
      const collisions = findSlugCollisions(skills);
      expect(collisions).toHaveLength(1);
      expect(collisions[0].slug).toBe("dup");
      expect(collisions[0].skillIds.sort()).toEqual(["one", "two"]);
    });
  });

  describe("renderPluginSkill", () => {
    it("flattens paths to skills/<slug>/ regardless of canonical category", () => {
      const skill = makeSkill({ id: "a", slug: "alpha" });
      const files = renderPluginSkill(skill);
      expect(files[0].path).toBe("skills/alpha/SKILL.md");
    });

    it("carries support files at the flattened base path", () => {
      const skill = makeSkill({
        id: "a",
        slug: "alpha",
        files: [
          { path: "references/checklist.md", encoding: "utf-8", content: "x" },
          { path: "scripts/run.sh", encoding: "utf-8", content: "#!/bin/sh" },
        ],
      });
      const paths = renderPluginSkill(skill).map((f) => f.path);
      expect(paths).toContain("skills/alpha/references/checklist.md");
      expect(paths).toContain("skills/alpha/scripts/run.sh");
    });

    it("returns files sorted by path (deterministic)", () => {
      const skill = makeSkill({
        id: "z",
        slug: "zeta",
        files: [
          { path: "zz.md", encoding: "utf-8", content: "z" },
          { path: "aa.md", encoding: "utf-8", content: "a" },
        ],
      });
      const paths = renderPluginSkill(skill).map((f) => f.path);
      // Generator sorts with localeCompare for locale-stable output across platforms;
      // the assertion sorts the same way to stay equivalent.
      expect(paths).toEqual([...paths].sort((a, b) => a.localeCompare(b)));
    });
  });

  describe("buildSkillMarkdown", () => {
    it("emits frontmatter with the slug as name", () => {
      const md = buildSkillMarkdown(makeSkill({ id: "a", slug: "alpha-beta" }));
      expect(md).toContain("name: alpha-beta");
    });

    it("appends a governance footer when sources are present", () => {
      const md = buildSkillMarkdown(
        makeSkill({
          id: "a",
          slug: "a",
          sources: [
            { title: "ZATCA", url: "https://zatca.gov.sa", accessed: "2026-01-01" },
          ],
        }),
      );
      expect(md).toContain("_Version: 0.1.0");
      expect(md).toContain("**Sources**");
      expect(md).toContain("[ZATCA](https://zatca.gov.sa)");
    });
  });

  describe("stableStringify", () => {
    it("sorts object keys alphabetically", () => {
      const out = stableStringify({ z: 1, a: 2 });
      expect(out.indexOf('"a"')).toBeLessThan(out.indexOf('"z"'));
    });

    it("ends with a trailing newline", () => {
      expect(stableStringify({ a: 1 }).endsWith("\n")).toBe(true);
    });
  });

  describe("clampDescription", () => {
    it("collapses internal whitespace", () => {
      expect(clampDescription("a   b\n\nc")).toBe("a b c");
    });
  });

  describe("formatFrontmatterValue", () => {
    it("quotes values that look like YAML scalars", () => {
      expect(formatFrontmatterValue("true")).toBe('"true"');
      expect(formatFrontmatterValue("has: colon")).toBe('"has: colon"');
    });

    it("leaves safe identifiers unquoted", () => {
      expect(formatFrontmatterValue("simple-slug")).toBe("simple-slug");
    });
  });
});
