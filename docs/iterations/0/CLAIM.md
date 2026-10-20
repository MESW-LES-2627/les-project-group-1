# Iteration 0 - Claim

Assist Club - Iteration 0 (Sprint 0). This file links to everything we deliver in this increment.

## Delivery

- **This tag:** [iteration-0](https://github.com/MESW-LES-2627/les-project-group-1/releases/tag/iteration-0)
- **Compare with the last tag:** N/A (first iteration, there is no previous tag)

## Environments

- **Production:** [assistclub.joaovicente.dev](https://assistclub.joaovicente.dev)
- **Staging:** [assistclub-dev.joaovicente.dev](https://assistclub-dev.joaovicente.dev)
- **Pipeline:** [GitHub Actions](https://github.com/MESW-LES-2627/les-project-group-1/actions)

## Product

- **MVP:** [MVP.md](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/docs/iterations/0/MVP.md)
- **Vision:** [vision.md](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/docs/iterations/0/vision.md)
- **Stories in this increment:** [Iteration 0 board](https://github.com/orgs/MESW-LES-2627/projects/11/views/1)

## Quality

- **How to run the tests:** [README.md, section "Running the tests"](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/README.md#running-the-tests)

## Team

- **Retrospective:** [retrospective.md](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/docs/iterations/0/retrospective.md)
- **AI log:** [AI-log.md](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/docs/iterations/0/AI-log.md)
- **Team artefacts:** [see section below](#team-artefacts)

## Team artefacts

Process and planning:
- [Definition of Done](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/docs/iterations/0/definition-of-done.md) - when a user story is considered done
- [Project board](https://github.com/orgs/MESW-LES-2627/projects/11) - backlog, iterations and status of all issues

Setup and delivery:
- [README.md](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/README.md) - setup, tech stack, how to run the full flow and the tests
- [.env.example](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/.env.example) - environment variables
- [.github/workflows/ci.yml](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/.github/workflows/ci.yml) - CI pipeline
- [docker-compose.prod.yml](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/docker-compose.prod.yml) - production container setup

Backend ([auction-backend](https://github.com/MESW-LES-2627/les-project-group-1/tree/iteration-0/auction-backend)):
- [index.ts](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-backend/index.ts) - server entry point
- [src/schema.sql](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-backend/src/schema.sql) - database schema
- [src/db.ts](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-backend/src/db.ts) - database connection
- [src/migrate.ts](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-backend/src/migrate.ts) - database migration script
- [src/winners.ts](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-backend/src/winners.ts) - winners
- [src/payments.ts](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-backend/src/payments.ts) - payments
- [src/stripe.ts](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-backend/src/stripe.ts) - Stripe integration
- [src/email.ts](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-backend/src/email.ts) - email sending (Resend)
- [tests/auction-reset.test.ts](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-backend/tests/auction-reset.test.ts) - backend automated test

Frontend ([auction-frontend](https://github.com/MESW-LES-2627/les-project-group-1/tree/iteration-0/auction-frontend)):
- [src/auction/AuctionPage.tsx](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-frontend/src/auction/AuctionPage.tsx) - auction page
- [src/auction/AuctionApp.tsx](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-frontend/src/auction/AuctionApp.tsx) - auction application
- [src/auction/utils.ts](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-frontend/src/auction/utils.ts) - auction helper functions
- [src/components/BidPanel.tsx](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-frontend/src/components/BidPanel.tsx) - bid panel
- [src/components/LatestBids.tsx](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-frontend/src/components/LatestBids.tsx) - latest bids
- [src/components/CausesList.tsx](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-frontend/src/components/CausesList.tsx) - causes list
- [src/components/PlayerDetails.tsx](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-frontend/src/components/PlayerDetails.tsx) - player details
- [src/components/EmailGate.tsx](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-frontend/src/components/EmailGate.tsx) - email entry
- [src/tests/utils.test.ts](https://github.com/MESW-LES-2627/les-project-group-1/blob/iteration-0/auction-frontend/src/tests/utils.test.ts) - frontend automated test