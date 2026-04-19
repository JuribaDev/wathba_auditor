# Agent Skills Generator — Design Notes

## Audience
Developers who don't have deep background in the specific compliance/security tech (ZATCA, PDPL, Nafath, etc.). The tone should be **explanatory, not assumed**. Every skill card should say *what this is and why you need it* in one sentence before the technical jargon.

## Visual system
Warm editorial. Cream background, burnt-sienna primary, serif display, sans body. Generous whitespace. Feels closer to a thoughtful publication (Stripe docs × Are.na × Paul Graham essay) than a typical SaaS config tool.

- **Type**: "Fraktur"-adjacent serif for display is too novelty; instead use a warm literary serif like Spectral or Source Serif for headings, Inter for body/UI.
  Actually per system rules: avoid Inter. Use IBM Plex Sans or Geist for UI. Use Source Serif 4 for display.
  For Arabic: IBM Plex Sans Arabic (matches Plex family) + Amiri for serif display.
- **Color**: exactly as specified. `#F7F2EA` bg, `#8F4B24` primary. Dark mode: deep walnut not pitch black.

## Flow
1. **Landing** — positioning, explains what skills are, CTA → Generate
2. **Questionnaire step 1/4**: About your project (market, invoicing, PII, payments, identity)
3. **Questionnaire step 2/4**: Tech context (stack, agents, CI, secrets)
4. **Review step 3/4**: Recommended skills + manual add/remove + variables
5. **Generate step 4/4**: Target picker, preview per target, download zip
6. **Skill library** (accessible from nav): index + detail

## Layout principles for non-expert audience
- Every question has a **"why we ask"** expandable explainer
- Every recommended skill has a **"what this means in plain English"** line above the technical summary
- Status badges use friendly labels: "Under review" not "draft", "Peer-reviewed" not "maintainer-reviewed"
- Disclaimers appear as quiet inline notices, not modal interrupts

## Tweaks
- Language: EN / AR (flips whole UI + RTL)
- Theme: Light / Dark
- Primary color: Burnt sienna (default), Ink blue, Olive, Slate

## Components (built)
- Button, Badge, Card, RadioGroup, Checkbox, Select, Toggle, Stepper, Disclosure, CodePreview, TreeView (for zip), FileCard
