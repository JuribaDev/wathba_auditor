# mada and STC Pay Integration Notes

## BIN handling

- Maintain a table of active mada BIN ranges rather than regex-matching a static prefix.
- Recognize co-badged cards: a single card can be routed through mada domestically and through Visa or Mastercard internationally.

## 3DS and authentication

- mada flows frequently require 3DS on lower amounts than some international merchants expect. Do not hardcode a 3DS threshold based on non-Saudi guidance.
- Treat a 3DS challenge timeout as a non-final state. The user may complete the challenge asynchronously.
- Store the authentication attempt id, challenge status, and return URL correlation id server-side; do not rely on client query parameters as the source of truth.
- Make retries explicit. A retry creates a new attempt linked to the original checkout intent, not a second charge against the same intent.

## Settlement and reconciliation

- Settlement files from Saudi acquirers are typically delivered daily. Build reconciliation workers that tolerate late files rather than missing them.
- Keep a dedicated reconciliation state machine so mismatches are visible to operations without manual spreadsheets.
- Import settlement files append-only and keep raw file hashes so finance can prove which file produced each reconciliation event.
- Surface unmatched captures, duplicate settlements, and stale pending wallet payments in an operations view with owner and age.

## Refunds and chargebacks

- Partial refunds must reference the original authorization. Orphan refunds are a red flag.
- Chargeback responses have strict evidence windows. Surface upcoming deadlines in internal dashboards rather than depending on email reminders.
- Refund eligibility should be computed from internal settled state, not from client-supplied transaction ids.
- Chargeback evidence should exclude unrelated personal data and preserve only the data needed for the dispute.

## User disclosures and limits

- Capture the fee, currency, payee, and transaction reference in local state before redirecting or handing off to a wallet.
- Keep payment limits configurable by policy and auditable by change history.
- Planned downtime or PSP degradation should produce a user-visible degraded state, not silent checkout failure.
