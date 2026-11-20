# Assist Club - AI log (Iteration 2)

Adopted output was reviewed by at least one team member and checked with tests, CI or a manual browser run. The "What we decided" column states the verdict and the check that was used.

## How to read this log

- Each entry records why we used AI, what it produced and what we decided.
- Verdicts: **Adopted** (used with minor edits), **Adapted** (used after substantial changes), **Rejected** (not used).

## UX/UI

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-20 | Claude | Show buyers whether they can bid on an auction | Status badges and an "Opens in …" countdown on the catalogue and auction page | Checked in the browser and covered by frontend tests |


## Architecture and data

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-20 | Claude | Support the Scheduled, Active, Completed and Cancelled statuses | Status worked out from the dates, plus a migration adding `auction_starts_at` and `cancelled_at` | Adopted. Covered by backend tests |
| 2026-11-20 | Claude | Decide who can delete, reject and cancel a listing | A model where each action has one meaning at one stage | The first version was confusing, so we simplified it |


## Implementation

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-20 | Claude | Let clubs create and edit auctions | The club's new auction page and editing of auction settings until the auction opens | Adopted. Covered by tests |


## Debugging

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-20 | Claude | Find why clubs never saw their listings in the dashboard | Two dashboard routes with the same path | Fixed, with a regression test |
| 2026-11-20 | Claude | Find why buyers still saw the old price after an edit | A bug in code AI had written earlier | Fixed and added a test; found through manual testing |


## Testing and CI

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-20 | Claude | Cover the auction user stories | Backend and frontend tests for creation, statuses, management and countdowns | Key rules were broken on purpose to confirm the tests failed |


## Critical reasoning

- **Verified items**: clubs create the item and the auction together, but the auction is only public after the admin verifies the item. We accepted this interpretation and documented it in the pull request.
- **AI-introduced bug**: a bug in code AI wrote earlier was missed by its own tests and only caught by manual testing, so we kept testing in the browser.

## Outcome

