# mada and STC Pay Integration Notes

## BIN handling

- Maintain a table of active mada BIN ranges rather than regex-matching a static prefix.
- Recognize co-badged cards: a single card can be routed through mada domestically and through Visa or Mastercard internationally.

## 3DS and authentication

- mada flows frequently require 3DS on lower amounts than some international merchants expect. Do not hardcode a 3DS threshold based on non-Saudi guidance.
- Treat a 3DS challenge timeout as a non-final state. The user may complete the challenge asynchronously.

## Settlement and reconciliation

- Settlement files from Saudi acquirers are typically delivered daily. Build reconciliation workers that tolerate late files rather than missing them.
- Keep a dedicated reconciliation state machine so mismatches are visible to operations without manual spreadsheets.

## Refunds and chargebacks

- Partial refunds must reference the original authorization. Orphan refunds are a red flag.
- Chargeback responses have strict evidence windows. Surface upcoming deadlines in internal dashboards rather than depending on email reminders.
