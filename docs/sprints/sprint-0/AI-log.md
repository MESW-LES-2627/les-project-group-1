# Assist Club - AI log


| Date | Tool | What we used it for | What we did with the result |
|---|---|---|---|
| 2026-10-19 | Claude | Feedback on the Vision and MVP; help planning the issues and the project board | Used the suggestions to improve and correct our own drafts; the team reviewed and decided what to apply |
| 2026-10-19 | Claude | Setting up the project on a local machine: installing Bun, understanding the backend and frontend structure and their dependencies | Followed the steps to run the backend and frontend locally |
| 2026-10-19 | Claude | Stripe integration: how Checkout sessions and webhooks work, Stripe CLI setup, and code to create the payment link for the winning bid and to handle the payment webhook | Adapted the code to our backend and tested it with Stripe test cards; fixed a webhook signature error by switching to the async signature verification, which is required when running on Bun |
| 2026-10-20 | Claude | Resend integration: sending the payment link to the auction winner and a payment confirmation email | Added it to the backend and tested it end to end; learned that the Resend test sender only delivers to the email of the account that owns the API key |
| 2026-10-20 | Claude | Postgres integration: database schema for the winners, connection, migration script and replacing the winners.json file | Applied the code, checked the rows in DBeaver while testing the full flow, and removed winners.json |
