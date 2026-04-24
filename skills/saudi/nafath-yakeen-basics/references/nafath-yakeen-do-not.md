# Common Hallucinations to Flag

If generated code contains any of the following, pause and ask the human for the real integration contract before proceeding.

- A hardcoded "Nafath API" base URL that was not referenced from a trusted document.
- A function signature that accepts a national ID and returns a full citizen profile — Nafath does not work that way.
- A "Yakeen key" treated as a static API token in an `.env.example` file.
- A fallback branch that silently treats a verification timeout as a successful verification.
- A mock implementation that returns "verified: true" without being clearly labelled as a development stub.
- A retry loop on an authentication call that keeps calling until success — real flows rate-limit and expect backoff.
- A provider response stored wholesale in the user table without a retention policy.
- A national ID or Iqama written to logs, analytics, exception trackers, or support chat transcripts.
- A production code path that can switch from Nafath/Yakeen to self-attestation without a separate risk decision.
- A UI that promises "government verified" before the approved provider response has reached a final success state.
