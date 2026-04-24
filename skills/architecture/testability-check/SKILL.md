# Testability Check

## When this skill activates

Use this skill whenever the work introduces new modules, refactors existing ones, or adds non-trivial behavior that the agent intends to "test later." Apply the check before the code is merged, not at the end of the sprint.

Also use it when the work touches payments, identity providers, ZATCA XML/signing, scheduled jobs, webhooks, caching, retries, clocks, random ids, external APIs, or file/database side effects.

## Baseline rules

1. A new behavior is not done until a test exercising it can be written without restructuring the code.
2. Side effects (network, filesystem, time, randomness) enter the module through an injected seam, not through a direct import.
3. Shared state is explicit. No module-level mutable singletons that the test suite has to reset by incantation.
4. If the agent finds itself writing a mock of a mock, the underlying design is wrong — restructure first.
5. Domain rules are testable without the web framework, real database, real queue, real clock, real PSP, or real identity provider.
6. Retry, timeout, and idempotency behavior must be tested with deterministic fakes, not by sleeping in tests.

## Seams to build

### Time

- Prefer a `now()` function injected into the module over `new Date()` scattered across calls.
- Tests control the clock; production wires the real clock at startup.
- Timeouts, retention, token expiry, invoice reporting windows, and reconciliation age use the injected clock.

### Randomness and ids

- Inject id generation through a factory, not a global `randomUUID()` call.
- Tests can assert deterministic sequences; production passes the real generator.
- Sequence-dependent systems such as invoice counters and idempotency keys need collision and replay tests.

### Network and filesystem

- Keep the HTTP or filesystem client behind a narrow interface.
- Production wires the concrete implementation once at boot. Tests wire a fake without monkey-patching.
- Provider adapters should normalize errors into local domain outcomes before business logic sees them.

### Configuration

- Configuration is data passed in, not globals read from process env inside domain code.
- A module that needs a flag receives it through its constructor or factory, not through a lookup.
- Test configuration should be constructed in code. Do not rely on ambient developer machine env vars.

## Shape indicators

- Public functions accept the data they need and return the data they produce.
- Side effects are orchestrated at the outer layer, not the inner one.
- Test files mirror source files so a reviewer can find coverage quickly.
- Fixtures live near the behavior they protect and are small enough for reviewers to understand.
- Contract tests cover provider adapters; unit tests cover domain state transitions.

## Anti-patterns the agent should refuse

- `jest.mock("module")` or equivalents as the primary isolation strategy. Prefer architectural seams.
- Tests that depend on a specific order, a shared fixture, or a stateful bootstrap script.
- Integration tests used as a workaround because unit tests are "too hard to write" — that is a signal the design needs a seam.
- Tests that wait for real time, call live third-party services, or depend on a developer's `.env` file.
- A fake that behaves more optimistically than the real provider by always succeeding.

## Related skills

- Use `ci-hygiene` to ensure the tests run in CI and generated fixtures cannot drift.
- Use `mada-stcpay-basics`, `nafath-yakeen-basics`, or `zatca-phase2` when the tested behavior touches Saudi payment, identity, or e-invoicing integrations.
