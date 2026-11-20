# Assist Club - AI log (Iteration 2)

Adopted output was reviewed by at least one team member and checked with tests, CI or a manual browser run. The "What we decided" column states the verdict and the check that was used.

## How to read this log

- Each entry records why we used AI, what it produced and what we decided.
- Verdicts: **Adopted** (used with minor edits), **Adapted** (used after substantial changes), **Rejected** (not used).

## UX/UI

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-20 | Claude | Show buyers whether they can bid on an auction | Status badges and an "Opens in …" countdown on the catalogue and auction page | Checked in the browser and covered by frontend tests |
| 2026-11-19 | Gemini | Give immediate UI feedback when non-buyer accounts try to place a bid | Added role check in `handleBid` and socket `bid_error` listener in `AuctionApp.tsx` | Adopted. Tested with a club account in browser |
| 2026-11-19 | Claude | Get help to make the expanded bidding history scroll when it gets long | A suggestion to limit the list height and scroll it, with a fixed table header | Adapted. We applied it to the Latest bids card and checked it in the browser |

## Architecture and data

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-20 | Claude | Support the Scheduled, Active, Completed and Cancelled statuses | Status worked out from the dates, plus a migration adding `auction_starts_at` and `cancelled_at` | Adopted. Covered by backend tests |
| 2026-11-20 | Claude | Decide who can delete, reject and cancel a listing | A model where each action has one meaning at one stage | The first version was confusing, so we simplified it |
| 2026-11-19 | Deepseek | Let an admin approve or reject clubs, not only view them | A pending/approved/rejected status model with search and pagination for clubs | Adopted. Covered by admin endpoint tests |
| 2026-11-20 | Deepseek | Let a club support a verified charity and set a donation percentage | `country` and `verified` on charities, charity and donation fields on listings, and the validation rules | Adapted. Tightened it so only verified charities can be picked and the percentage stays 0–100 |
| 2026-11-19 | Gemini | Centralize auction state validation rules in the service layer | Helped extended `evaluateAndPlaceBid` returning structured status and error codes | Adopted. Reused across REST and Socket handlers |
| 2026-11-19 | Gemini | Prevent race conditions when multiple users bid on the same auction simultaneously | A promise queue (`withAuctionLock`) in `auction.service.ts` serializing room state updates and database persistence | Adopted. Applied to both REST and WebSocket bid handlers and verified with concurrent tests |



## Implementation

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-20 | Claude | Let clubs create and edit auctions | The club's new auction page and editing of auction settings until the auction opens | Adopted. Covered by tests |
| 2026-11-19 | Deepseek | Give the admin dashboard a clubs management page | A React Query hook, a searchable and filterable table and approve/reject actions | Adopted. Tested in the browser against the running backend |
| 2026-11-19 | Gemini | Review our custom club/role status check and verify if the bidding logic made sense | Confirmed the `role === "BUYER"` restriction and pointed out where to enforce it on both REST and Socket endpoints | Adapted. Applied the checks on the backend and added UI error feedback for clubs |
| 2026-11-18 | Claude | generate crud API for Memorabilia listing | Api endpoints for the backend | Adapted. Applied the code |
| 2026-11-19 | Claude | generate dashboard components and pages for the listing | components to get/edit/delete listing using endpoints | Adapted. Applied the code |

## Debugging

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-20 | Claude | Find why clubs never saw their listings in the dashboard | Two dashboard routes with the same path | Fixed, with a regression test |
| 2026-11-20 | Claude | Find why buyers still saw the old price after an edit | A bug in code AI had written earlier | Fixed and added a test; found through manual testing |
| 2026-11-18 | Deepseek | Find why the dashboard styles were changing the rest of the site | The dashboard CSS imported globally, with `:root` and `.dark` rules leaking into every page | Adopted. Scoped the styles under `.dashboard-theme` toggled on `body`, checked the public pages in the browser |
| 2026-11-20 | Deepseek | Explain why the concurrent bid test failed intermittently | A test that depended on request order instead of the auction lock's guarantee | Adapted. Rewrote it to assert exactly one accepted bid and added a second lower-bid batch |
| 2026-11-20 | Deepseek | Find why several backend tests failed after the Stripe changes | The Stripe client being created at import time, before the test environment has a key | Adopted. Made the client lazy with `getStripe()`; tests pass without a real key |
| 2026-11-19 | Gemini | Fix UI blocking first bid at starting price and legacy socket test timeouts | Fixed `min` attribute in `BidPanel.tsx` and scoped unauthenticated socket fallback to `demo` room | Adopted. Confirmed all tests pass |


## Testing and CI

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-20 | Claude | Cover the auction user stories | Backend and frontend tests for creation, statuses, management and countdowns | Key rules were broken on purpose to confirm the tests failed |
| 2026-11-20 | Deepseek | Cover the charity selection rules end to end | Tests for verified-only selection, donation bounds and rejected selections | Adapted. Ran them in CI and kept the cases that matched our rules |
| 2026-11-19 | Gemini | Test all bid submission and validation acceptance criteria | Created `place-bid.test.ts` and updated `AuctionApp.test.tsx` | Adapted. Fixed a variable typo in test and verified full suite passes |
| 2026-11-19 | Gemini | Update frontend unit tests to match the new first-bid rule | Adjusted minimum bid placeholder assertions in `AuctionApp.test.tsx` | Adopted. Verified `bun test` passes |
| 2026-11-19 | Claude | Get help writing tests for the highest bid and bidding history | Drafts of backend and frontend tests for the bid rules and the history | Adapted. We fixed the drafts that failed and ran them with `bun test` |



## Critical reasoning

- **Verified items**: clubs create the item and the auction together, but the auction is only public after the admin verifies the item. We accepted this interpretation and documented it in the pull request.
- **AI-introduced bug**: a bug in code AI wrote earlier was missed by its own tests and only caught by manual testing, so we kept testing in the browser.
- **Dashboard CSS**: we scoped the dashboard theme to `.dashboard-theme` on `body` instead of deleting the stylesheet, so the dashboard keeps its look while the public pages return to the global theme.
- **Stripe at import**: the lazy client keeps the app importable in tests while still failing loudly in production if `STRIPE_SECRET_KEY` is missing.
- **Charity selection**: we enforce "verified only" and 0–100 on the server, not just in the form, because a client can send any value.
- **Concurrent bids**: the test now asserts the invariant (one accepted bid) rather than a fixed order, because the lock does not promise order.
- **Club status and role validation**: We built the `CLUB` role/status check ourselves to prevent clubs from bidding on auctions, and used AI to review whether the logic covered all entry points. Based on that review, we kept our role logic and added the same check to the Socket.IO handler so clubs cannot bypass the UI. 
- **First-bid and auction state rules**: Instead of trusting client-side checks alone, we kept all bid increment, starting price and auction status validations in `auction.service.ts` so both HTTP and WebSocket bids follow the exact same rules.


## Outcome

AI sped up most of the stories for this iteration.

The two bugs that cost us the most time, the dashboard CSS and the eager Stripe client, were found by tests and manual browser runs rather than by the AI that suggested the code, so we kept verifying in CI and in the browser.

For the next iteration we will keep AI prompts narrow enough to review, and check data migrations and CSS changes against the running app before merging.

Overall, AI tooling helped us deliver a better iteration.

