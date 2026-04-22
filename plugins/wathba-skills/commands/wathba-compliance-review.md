---
description: Audit Saudi-market code for ZATCA Phase 2, PDPL, Nafath/Yakeen, and mada/STC Pay compliance using Wathba's compliance skills.
argument-hint: [path-or-file]
---

Perform a compliance audit for Saudi-market regulations using the Wathba
compliance skills (zatca-phase2, pdpl-basics, nafath-yakeen-basics,
mada-stcpay-basics).

Focus on:
- E-invoicing shape (UUID, cryptographic stamp, QR, simplified vs standard flow)
- Personal-data handling, consent, data-residency, subject-rights endpoints
- National-ID / authentication integration boundaries
- Local-rail payment integration correctness

For each finding, cite the governing source attached in the relevant skill's
`sources` block. Separate legal questions (out of scope) from engineering
findings (in scope). Produce a ranked punch list with file paths and line
numbers. Treat the output as engineering guidance, not legal advice.

Target: ${ARGUMENTS:-the current working tree}
