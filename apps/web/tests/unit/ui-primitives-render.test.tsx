import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Notice } from "@/components/ui/notice";
import { Disclosure } from "@/components/ui/disclosure";
import { Toggle } from "@/components/ui/toggle";
import { RadioCardGroup } from "@/components/ui/radio-card";
import { CheckboxCardGroup } from "@/components/ui/checkbox-card";

describe("Button primitive", () => {
  it("renders a native button by default with variant/size data attributes", () => {
    render(<Button>Generate</Button>);
    const button = screen.getByRole("button", { name: "Generate" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("data-slot", "button");
    expect(button).toHaveAttribute("data-variant", "default");
    expect(button).toHaveAttribute("data-size", "default");
  });

  it("reflects explicit variant and size props as data attributes", () => {
    render(
      <Button variant="ghost" size="sm">
        Back
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Back" });
    expect(button).toHaveAttribute("data-variant", "ghost");
    expect(button).toHaveAttribute("data-size", "sm");
  });

  it("invokes onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Continue</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("blocks click events when disabled", () => {
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Download
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Download" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("renders as the child element when asChild is set", () => {
    render(
      <Button asChild>
        <a href="https://example.com/open-library">Open library</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Open library" });
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("data-slot", "button");
    expect(link).toHaveAttribute("href", "https://example.com/open-library");
  });
});

describe("Badge primitive", () => {
  it("renders with default variant data attribute", () => {
    render(<Badge>Saudi</Badge>);
    const badge = screen.getByText("Saudi");
    expect(badge).toHaveAttribute("data-slot", "badge");
  });

  it("forwards asChild so a link can carry badge styling", () => {
    render(
      <Badge asChild>
        <a href="https://example.com/saudi">Saudi</a>
      </Badge>,
    );
    const link = screen.getByRole("link", { name: "Saudi" });
    expect(link).toHaveAttribute("data-slot", "badge");
    expect(link).toHaveAttribute("href", "https://example.com/saudi");
  });
});

describe("StatusBadge primitive", () => {
  it("renders the default label for each supported status", () => {
    const { rerender } = render(<StatusBadge status="reviewed" />);
    expect(screen.getByText("Reviewed")).toBeInTheDocument();
    rerender(<StatusBadge status="community" />);
    expect(screen.getByText("Community")).toBeInTheDocument();
    rerender(<StatusBadge status="draft" />);
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });

  it("renders a custom localized label when children are provided", () => {
    render(<StatusBadge status="reviewed">مُراجَع</StatusBadge>);
    expect(screen.getByText("مُراجَع")).toBeInTheDocument();
    expect(screen.queryByText("Reviewed")).not.toBeInTheDocument();
  });

  it("exposes the status via a data attribute for CSS hooks", () => {
    render(<StatusBadge status="draft" />);
    const badge = screen.getByText("Draft");
    expect(badge).toHaveAttribute("data-status", "draft");
    expect(badge).toHaveAttribute("data-slot", "status-badge");
  });
});

describe("Notice primitive", () => {
  it("renders a warning notice with an accessible role and title", () => {
    render(
      <Notice variant="warning" title="Disclaimer">
        Not legal advice.
      </Notice>,
    );
    const notice = screen.getByRole("note");
    expect(notice).toHaveAttribute("data-variant", "warning");
    expect(within(notice).getByText("Disclaimer")).toBeInTheDocument();
    expect(within(notice).getByText("Not legal advice.")).toBeInTheDocument();
  });

  it("renders an info notice when variant=info is set", () => {
    render(<Notice variant="info">Heads up</Notice>);
    expect(screen.getByRole("note")).toHaveAttribute("data-variant", "info");
  });

  it("renders without a title wrapper when no title is provided", () => {
    render(<Notice variant="info">Body only</Notice>);
    const notice = screen.getByRole("note");
    expect(within(notice).getByText("Body only")).toBeInTheDocument();
    expect(within(notice).queryAllByText(/disclaimer/i)).toHaveLength(0);
  });
});

describe("Disclosure primitive", () => {
  it("starts closed by default and reveals content when toggled", () => {
    render(
      <Disclosure summary="Why we ask">
        <p>To tailor recommendations.</p>
      </Disclosure>,
    );
    const details = screen.getByText("Why we ask").closest("details");
    expect(details).not.toBeNull();
    expect(details).not.toHaveAttribute("open");
    // Simulate the native <details> toggle.
    fireEvent.click(screen.getByText("Why we ask"));
    expect(details?.querySelector("summary")).not.toBeNull();
  });

  it("respects defaultOpen=true", () => {
    render(
      <Disclosure summary="Details" defaultOpen>
        <p>Body</p>
      </Disclosure>,
    );
    const details = screen.getByText("Details").closest("details");
    expect(details).toHaveAttribute("open");
    expect(screen.getByText("Body")).toBeInTheDocument();
  });
});

describe("Toggle primitive", () => {
  it("exposes the Radix switch role and current checked state", () => {
    const handleChange = vi.fn();
    render(
      <Toggle
        checked={false}
        onCheckedChange={handleChange}
        label="Enable dark mode"
      />,
    );
    const toggle = screen.getByRole("switch", { name: "Enable dark mode" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
  });

  it("calls onCheckedChange when the switch is clicked", () => {
    const handleChange = vi.fn();
    render(
      <Toggle
        checked={false}
        onCheckedChange={handleChange}
        ariaLabel="Toggle CI"
      />,
    );
    fireEvent.click(screen.getByRole("switch", { name: "Toggle CI" }));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it("renders as checked when the checked prop is true", () => {
    render(
      <Toggle
        checked={true}
        onCheckedChange={() => {}}
        ariaLabel="Persist answers"
      />,
    );
    const toggle = screen.getByRole("switch", { name: "Persist answers" });
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("renders a description alongside the label", () => {
    render(
      <Toggle
        checked={false}
        onCheckedChange={() => {}}
        label="CI on PRs"
        description="Run checks on every pull request"
      />,
    );
    expect(screen.getByText("CI on PRs")).toBeInTheDocument();
    expect(
      screen.getByText("Run checks on every pull request"),
    ).toBeInTheDocument();
  });
});

describe("RadioCardGroup primitive", () => {
  const options = [
    { value: "ksa", label: "KSA" },
    { value: "gcc", label: "GCC", description: "Regional" },
    { value: "global", label: "Global" },
  ];

  it("renders each option as a radio with an accessible name", () => {
    render(
      <RadioCardGroup
        value={null}
        onValueChange={() => {}}
        options={options}
        name="market"
        aria-label="Primary market"
      />,
    );
    const group = screen.getByRole("radiogroup", { name: "Primary market" });
    expect(within(group).getAllByRole("radio")).toHaveLength(options.length);
    expect(within(group).getByText("Regional")).toBeInTheDocument();
  });

  it("calls onValueChange with the clicked option value", () => {
    const handleChange = vi.fn();
    render(
      <RadioCardGroup
        value={null}
        onValueChange={handleChange}
        options={options}
        name="market"
        aria-label="Primary market"
      />,
    );
    fireEvent.click(screen.getByText("GCC"));
    expect(handleChange).toHaveBeenCalledWith("gcc");
  });

  it("marks the option matching value as checked", () => {
    render(
      <RadioCardGroup
        value="ksa"
        onValueChange={() => {}}
        options={options}
        name="market"
        aria-label="Primary market"
      />,
    );
    const ksa = screen.getByRole("radio", { name: /KSA/ });
    expect(ksa).toHaveAttribute("aria-checked", "true");
    const global = screen.getByRole("radio", { name: /Global/ });
    expect(global).toHaveAttribute("aria-checked", "false");
  });
});

describe("CheckboxCardGroup primitive", () => {
  const options = [
    { value: "claude", label: "Claude Code" },
    { value: "cursor", label: "Cursor" },
    { value: "codex", label: "Codex", description: "AGENTS.md" },
  ];

  it("renders a labeled group with one checkbox per option", () => {
    render(
      <CheckboxCardGroup
        values={[]}
        onValuesChange={() => {}}
        options={options}
        name="targets"
        aria-label="Target agents"
      />,
    );
    const group = screen.getByRole("group", { name: "Target agents" });
    expect(within(group).getAllByRole("checkbox")).toHaveLength(options.length);
  });

  it("adds a value to the selection when an unchecked option is clicked", () => {
    const handleChange = vi.fn();
    render(
      <CheckboxCardGroup
        values={["claude"]}
        onValuesChange={handleChange}
        options={options}
        name="targets"
        aria-label="Target agents"
      />,
    );
    fireEvent.click(screen.getByText("Cursor"));
    expect(handleChange).toHaveBeenCalledWith(["claude", "cursor"]);
  });

  it("removes a value from the selection when a checked option is clicked", () => {
    const handleChange = vi.fn();
    render(
      <CheckboxCardGroup
        values={["claude", "cursor"]}
        onValuesChange={handleChange}
        options={options}
        name="targets"
        aria-label="Target agents"
      />,
    );
    fireEvent.click(screen.getByText("Claude Code"));
    expect(handleChange).toHaveBeenCalledWith(["cursor"]);
  });

  it("reflects the current selection via aria-checked on each checkbox", () => {
    render(
      <CheckboxCardGroup
        values={["codex"]}
        onValuesChange={() => {}}
        options={options}
        name="targets"
        aria-label="Target agents"
      />,
    );
    const codex = screen.getByRole("checkbox", { name: /Codex/ });
    expect(codex).toHaveAttribute("aria-checked", "true");
    const claude = screen.getByRole("checkbox", { name: /Claude Code/ });
    expect(claude).toHaveAttribute("aria-checked", "false");
  });
});
