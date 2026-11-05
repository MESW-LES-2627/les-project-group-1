# Assist Club - AI log (Iteration 1)

Every suggestion was reviewed by team members and verified with tests before being merged.

## How to read this log

- Each entry records why we used AI, what it produced and what we decided
- Different sections with AI info for various areas of the project

## Planning and requirements

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|

## UX/UI

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-04 | Deepseek | Make the Tailwind classes readable and consistent | Reordered utilities into style maps and suggested shadcn primitives | Adopted, no visual design or behavioural change |
| 2026-11-04 | Deepseek | Make the navbar usable on mobile | Proposed breakpoints and a collapsible menu | Adopted, after adding a Navbar test and checking desktop, tablet and mobile widths |
| 2026-11-05 | Claude | Improve the catalogue UI/UX based on the group's existing prototypes and agreed layout | Suggestions for improving the layout, component organisation, visual consistency and responsiveness | Reviewed and adapted the scripts to the project's requirements |

## Architecture and data

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-05 | Claude | Get assistance with the database SQL scripts | Suggestions and adjustments for the database schema, queries and migration scripts | Reviewed and adapted the scripts to match the project's data model and requirements |
| 2026-11-05 | Claude | Populate the database with fictional data for development and testing | Sample data for clubs, categories, memorabilia listings and related information | Reviewed and adapted the data to match the database schema |

## Implementation

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-05 | Claude | Get assistance with implementing catalogue search and category filtering | Suggestions for the search and filtering logic in the frontend and backend | Reviewed and adapted the suggestions to the existing implementation |
| 2026-11-05 | Claude | Support the implementation of independent auctions for each jersey | Suggestions for adapting the auction logic to handle multiple auctions using each listing's ID | Reviewed and adapted the changes while preserving the existing auction functionality |

## Debugging

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-05 | Deepseek | Understand why the pipeline failed after the Prisma merge | A series of commands to run manually on the VPS | Checked and worked, fixed the error |

## Testing and CI

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|
| 2026-11-04 | Deepseek | To help make the deploy via CI | Changes to the workflow in order to support automatic deploy on the VPS | Adopted, after testing running the pipeline |

## Documentation

| Date | Tool | Why we used it | What AI produced | What we decided |
|---|---|---|---|---|

## Critical reasoning: suggestions we rejected or adapted

- **A full rewrite of every Tailwind class:** adapted instead of accepted, we grouped classes where it improved readability but avoided churn in files that where otherwise not changing.
- **Creating unnecessary files and duplicating existing functionality:** Some initial suggestions did not reuse the group's existing code. We adapted the approach to avoid duplication and keep the implementation consistent with the project structure.

## Outcome

By the end of iteration 1, AI helped us deliver a better project.