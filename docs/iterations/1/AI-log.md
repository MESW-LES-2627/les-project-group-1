# Assist Club - AI log (Iteration 1)

Adopted output was reviewed by at least one team member and checked with tests, CI or a manual browser run. The "What we decided" column states the verdict and the check that was used.

## How to read this log

- Each entry records why we used AI, what it produced and what we decided.
- Verdicts: **Adopted** (used with minor edits), **Adapted** (used after substantial changes), **Rejected** (not used).

## UX/UI

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-04 | DeepSeek | Make the Tailwind classes readable and consistent | Reordered utilities into style maps and suggested shadcn primitives | Adapted. Grouped classes only where readability improved; no visual or behavioural change |
| 2026-11-04 | DeepSeek | Make the navbar usable on mobile | Proposed breakpoints and a collapsible menu | Adopted. Added a Navbar test and checked desktop, tablet and mobile widths |
| 2026-11-04 | Claude | Design the buyer profile page (photo, edit form, purchased jerseys) | Page layout and components reusing the existing Navbar, Button and Input, with a login prompt for visitors without a session | Adopted. Checked in the browser on desktop and mobile widths |
| 2026-11-05 | Claude | Improve the catalogue UI/UX based on the group's existing prototypes and agreed layout | Suggestions for improving the layout, component organisation, visual consistency and responsiveness | Adapted. Applied the suggestions that matched our prototypes and agreed layout |
| 2026-11-05 | Gemini | Structure React components for registration, password recovery, and address management | Proposed layout patterns and code structures using Tailwind CSS and TypeScript | Adapted. Enforced strict typing, responsive design and immediate user feedback |
| 2026-11-05 | Claude | Design the Charities, Sports, About Us and Support pages and the cards for them | Card layouts, simple SVG illustrations for the charities and sports, an FAQ built with `details` elements, and an About page with mission and "how it works" sections | Adopted. Content is mock data for now; the illustrations were resized after we saw they were too large in the cards |

## Architecture and data

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-05 | Claude | Get assistance with the database SQL scripts | Suggestions and adjustments for the database schema, queries and migration scripts | Adapted. Reviewed the schema, queries and migrations against our data model before applying |
| 2026-11-05 | Claude | Populate the database with fictional data for development and testing | Sample data for clubs, categories, memorabilia listings and related information | Adapted. Reviewed the seed data against the schema |
| 2026-11-05 | Claude | Move the buyer profile to the Prisma schema | An `avatar` column with its migration and the profile and purchases model functions | Adopted. The first version proposed its own sessions table, which we rejected in favour of the team's JWT authentication to avoid two token systems |
| 2026-11-05 | Gemini | Design relational schema constraints and default address logic | Suggestions for ORM cascade deletions and uniqueness enforcement for user shipping addresses | Adapted. Reviewed the cascade and uniqueness rules to protect relational integrity and avoid orphaned addresses |

## Implementation

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-05 | Claude | Get assistance with implementing catalogue search and category filtering | Suggestions for the search and filtering logic in the frontend and backend | Adapted. Integrated the logic into the existing catalogue flow |
| 2026-11-05 | Claude | Support the implementation of independent auctions for each jersey | Suggestions for adapting the auction logic to handle multiple auctions using each listing's ID | Adapted. Applied per-listing auction IDs while preserving the existing auction behaviour |
| 2026-11-05 | Gemini | Assistance on frontend logic for address CRUD operations and JWT authentication | Suggested implementation patterns for asynchronous HTTP requests with JWT tokens and local state management | Adapted. Matched the suggested request pattern to our REST endpoints and local state |
| 2026-11-05 | Claude | Log the user out automatically after the email changes | A change to the profile save handler that calls the existing logout when the saved email differs from the current one | Adopted. The logout only clears the session in the browser |

## Debugging

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-05 | DeepSeek | Understand why the pipeline failed after the Prisma merge | A series of commands to run manually on the VPS | Adopted. Ran the commands on the VPS and fixed the pipeline error |
| 2026-11-05 | Gemini | Diagnose and resolve asynchronous state synchronization and token handling issues | Analysis of client-server communication boundaries and suggested payload adjustments for protected requests | Adapted. Verified the payload and token changes through test runs before merging |
| 2026-11-05 | Claude | Fix the local setup errors after the Prisma migration (missing `JWT_SECRET`, non-empty database) | Commands to reset the local database, run the migrations and seed, and a fix for a corrupted `.env` line | Adopted. Applied locally only |

## Testing and CI

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-04 | DeepSeek | Help make the deploy via CI | Changes to the workflow to support automatic deploy on the VPS | Adopted. Verified by running the pipeline |
| 2026-11-05 | Gemini | Support test patterns and validation logic for frontend components | Suggested assertions and mock structures for verifying component states and user interactions | Adapted. Added assertions and mocks with no external network dependencies |
| 2026-11-05 | Claude | Understand why the backend CI job failed while the tests passed locally | The email service creates the Resend client when it is loaded and fails because the CI had no `RESEND_API_KEY` | Adopted. Added `RESEND_API_KEY` to `ci.yml` as a repository secret instead of hardcoding it |

## Critical reasoning: suggestions we rejected or adapted

- **Tailwind rewrite** We adapted instead of accepting a full rewrite of every class. We grouped classes where it improved readability but avoided churn in files that were otherwise not changing, because a large cosmetic diff makes review harder and adds no behaviour.
- **Duplicated functionality** Several initial suggestions created new files or repeated existing code. We rejected those parts and reused the existing components, routes and helpers instead. The check was whether the suggestion fitted the current project structure without introducing a parallel implementation.
- **Profile persistence** AI first proposed a dedicated sessions table for the buyer profile. We rejected it: the team already used JWT authentication, and keeping both would create two token systems, two expiry policies and two logout paths. We kept only the `avatar` column, its migration and the profile/purchases queries.
- **Cascade deletes and default addresses** We reviewed the proposed cascades because an incorrect cascade can silently delete user data. We kept the constraints that preserve relational integrity and avoided making address deletion ambiguous.
- **Logout after email change** We adopted this because the email is part of the login and recovery identity; forcing re-authentication after changing it reduces the risk of a stale session. We accepted the limitation that the current logout only clears the browser session.
  
## Outcome

AI accelerated scaffolding and several tasks: catalogue search and filtering, the buyer profile, the barebones of charities/sports/about/support pages, address CRUD, the Prisma migration and the CI deploy workflow.

For the next iteration we will use narrower prompts, check integration with existing code earlier, and keep security-sensitive configuration out of AI-assisted changes.

Overall, AI tooling helped us deliver a better iteration.
