---
name: testability-check
description: "Keep generated code writable-to-test. Clean seams, isolated side effects, no hidden singletons — so the test suite remains a first-class artifact as the codebase grows."
---

# Testability Check

## When this skill activates

Use this skill whenever the work introduces new modules, refactors existing ones, or adds non-trivial behavior that the agent intends to "test later." Apply the check before the code is merged, not at the end of the sprint.

## Baseline rules

1. A new behavior is not done until a test exercising it can be written without restructuring the code.
2. Side effects (network, filesystem, time, randomness) enter the module through an injected seam, not through a direct import.
3. Shared state is explicit. No module-level mutable singletons that the test suite has to reset by incantation.
4. If the agent finds itself writing a mock of a mock, the underlying design is wrong — restructure first.

## Seams to build

### Time

- Prefer a `now()` function injected into the module over `new Date()` scattered across calls.
- Tests control the clock; production wires the real clock at startup.

### Randomness and ids

- Inject id generation through a factory, not a global `randomUUID()` call.
- Tests can assert deterministic sequences; production passes the real generator.

### Network and filesystem

- Keep the HTTP or filesystem client behind a narrow interface.
- Production wires the concrete implementation once at boot. Tests wire a fake without monkey-patching.

### Configuration

- Configuration is data passed in, not globals read from process env inside domain code.
- A module that needs a flag receives it through its constructor or factory, not through a lookup.

## Shape indicators

- Public functions accept the data they need and return the data they produce.
- Side effects are orchestrated at the outer layer, not the inner one.
- Test files mirror source files so a reviewer can find coverage quickly.

## Anti-patterns the agent should refuse

- `jest.mock("module")` or equivalents as the primary isolation strategy. Prefer architectural seams.
- Tests that depend on a specific order, a shared fixture, or a stateful bootstrap script.
- Integration tests used as a workaround because unit tests are "too hard to write" — that is a signal the design needs a seam.

_Version: 0.4.0 · Last verified: 2026-03-10 · Status: community-maintained_

**Sources**

- [Martin Fowler on test doubles and seams](https://martinfowler.com/bliki/TestDouble.html)
