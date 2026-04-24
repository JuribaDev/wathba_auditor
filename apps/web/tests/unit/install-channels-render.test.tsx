import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  InstallChannels,
  type InstallChannelsLabels,
} from "@/components/questionnaire/install-channels";
import type { TargetAgent } from "@/lib/skills/recommendations";

const LABELS: InstallChannelsLabels = {
  heading: "Install Wathba skills",
  lede: "Pick the channel.",
  recommendedBadge: "Recommended",
  showStepsLabel: "Show steps",
  hideStepsLabel: "Hide steps",
  copyLabel: "Copy",
  copiedLabel: "Copied",
  copyFallback: "Copy failed",
};

const ALL_TARGETS: TargetAgent[] = ["claude-code", "cursor", "codex", "agents-md"];

describe("InstallChannels", () => {
  it("renders all five channels when every target is selected", () => {
    const { container } = render(
      <InstallChannels
        locale="en"
        labels={LABELS}
        selectedTargets={ALL_TARGETS}
      />,
    );
    const cards = container.querySelectorAll(
      '[data-slot="install-channel-card"]',
    );
    const order = Array.from(cards).map((c) => c.getAttribute("data-channel"));
    expect(order).toEqual([
      "marketplace",
      "local-plugin",
      "cursor",
      "codex",
      "manual",
    ]);
  });

  it("gates Cursor card on the cursor target being selected", () => {
    const { container, rerender } = render(
      <InstallChannels
        locale="en"
        labels={LABELS}
        selectedTargets={["claude-code"]}
      />,
    );
    expect(container.querySelector('[data-channel="cursor"]')).toBeNull();

    rerender(
      <InstallChannels
        locale="en"
        labels={LABELS}
        selectedTargets={["claude-code", "cursor"]}
      />,
    );
    expect(container.querySelector('[data-channel="cursor"]')).toBeTruthy();
  });

  it("gates Codex card on the codex target being selected", () => {
    const { container, rerender } = render(
      <InstallChannels
        locale="en"
        labels={LABELS}
        selectedTargets={["claude-code"]}
      />,
    );
    expect(container.querySelector('[data-channel="codex"]')).toBeNull();

    rerender(
      <InstallChannels
        locale="en"
        labels={LABELS}
        selectedTargets={["claude-code", "codex"]}
      />,
    );
    expect(container.querySelector('[data-channel="codex"]')).toBeTruthy();
  });

  it("hides the manual card when no targets are selected; shows it otherwise", () => {
    const { container, rerender } = render(
      <InstallChannels locale="en" labels={LABELS} selectedTargets={[]} />,
    );
    expect(container.querySelector('[data-channel="manual"]')).toBeNull();
    rerender(
      <InstallChannels
        locale="en"
        labels={LABELS}
        selectedTargets={["claude-code"]}
      />,
    );
    expect(container.querySelector('[data-channel="manual"]')).toBeTruthy();
  });

  it("manual card copy lists only the archive roots the user will actually receive", () => {
    const { container } = render(
      <InstallChannels
        locale="en"
        labels={LABELS}
        selectedTargets={["claude-code", "cursor"]}
      />,
    );
    const manual = container.querySelector(
      '[data-channel="manual"]',
    ) as HTMLElement;
    expect(manual.textContent).toContain(".claude/skills/");
    expect(manual.textContent).toContain(".cursor/rules/");
    expect(manual.textContent).toContain(".cursor/skills/");
    // Codex was NOT selected — its path must not appear.
    expect(manual.textContent).not.toContain(".agents/skills/");
    expect(manual.textContent).not.toContain("AGENTS.md");
  });

  it("marks the marketplace card as primary/recommended", () => {
    const { container } = render(
      <InstallChannels
        locale="en"
        labels={LABELS}
        selectedTargets={ALL_TARGETS}
      />,
    );
    const marketplace = container.querySelector(
      '[data-channel="marketplace"]',
    ) as HTMLElement;
    expect(marketplace.getAttribute("data-primary")).toBe("true");
    expect(within(marketplace).getByText("Recommended")).toBeTruthy();
  });

  it("marketplace + local-plugin remain visible even with no targets (plugin install is target-agnostic)", () => {
    const { container } = render(
      <InstallChannels locale="en" labels={LABELS} selectedTargets={[]} />,
    );
    expect(container.querySelector('[data-channel="marketplace"]')).toBeTruthy();
    expect(container.querySelector('[data-channel="local-plugin"]')).toBeTruthy();
  });

  it("surfaces the marketplace install commands verbatim", () => {
    const { container } = render(
      <InstallChannels
        locale="en"
        labels={LABELS}
        selectedTargets={ALL_TARGETS}
      />,
    );
    const marketplace = container.querySelector(
      '[data-channel="marketplace"]',
    ) as HTMLElement;
    const cmds = Array.from(
      marketplace.querySelectorAll('[data-slot="install-channel-command"] code'),
    ).map((el) => el.textContent);
    expect(cmds).toContain(
      "/plugin marketplace add JuribaDev/wathba_auditor",
    );
    expect(cmds).toContain("/plugin install wathba-skills@wathba");
  });

  it("renders Arabic copy when locale is ar", () => {
    render(
      <InstallChannels
        locale="ar"
        labels={LABELS}
        selectedTargets={ALL_TARGETS}
      />,
    );
    expect(screen.getByText("سوق Claude Code")).toBeTruthy();
    expect(screen.getByText("إضافة Claude Code محلية")).toBeTruthy();
  });

  it("marketplace card is expanded by default; others are collapsed", () => {
    const { container } = render(
      <InstallChannels
        locale="en"
        labels={LABELS}
        selectedTargets={ALL_TARGETS}
      />,
    );
    const marketplace = container.querySelector(
      '[data-channel="marketplace"]',
    ) as HTMLElement;
    expect(
      marketplace.querySelector('[data-slot="install-channel-steps"]'),
    ).toBeTruthy();
    const codex = container.querySelector(
      '[data-channel="codex"]',
    ) as HTMLElement;
    expect(
      codex.querySelector('[data-slot="install-channel-steps"]'),
    ).toBeNull();
  });
});
