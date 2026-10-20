![assist club logo](docs/images/logo_wordmark.png)

# Assist Club

Authentic sports memorabilia with a solidarity touch: join the club and assist for a goal.

Assist Club is an online platform for clubs to auction authentic sports memorabilia while supporting charitable causes and NGOs.

This project is part of the Laboratory of Software Engineering unit of the Master's in Software Engineering at FEUP, 2026/27.

## Team A
- Abdolsamad Mahmoodi (up202502506@up.pt)
- Afonso Caetano (up202303614@up.pt)
- Ana Carvalhal (up202305274@up.pt)
- João Mendes (up202208586@up.pt)
- Nádia Silva (up202305685@up.pt)

## Tech stack

- **Backend**: Express (TypeScript), running on Bun

- **DB**: Postgres

- **Frontend**: Vite (React + TypeScript)

- **External APIs**: Resend (email sending), Stripe (payment)

## Repository structure

```
auction-backend/    Express + Socket.IO server, Stripe, Resend and Postgres integrations
auction-frontend/   Vite + React client
docs/               Project documentation
```

## Getting started

### 1. Prerequisites

- [Bun](https://bun.sh): `curl -fsSL https://bun.sh/install | bash` (then reopen the terminal and check with `bun --version`)
- Postgres: `sudo apt install postgresql` (macOS: `brew install postgresql@16` and `brew services start postgresql@16`)
- [Stripe CLI](https://docs.stripe.com/stripe-cli) (used to receive webhooks locally), followed by `stripe login`

### 2. Database

Create a user and a database for the project:

```bash
sudo -u postgres psql -c "create user auction with password 'auction';"
sudo -u postgres psql -c "create database auction owner auction;"
```

To browse the data you can use [DBeaver](https://dbeaver.io) (connect to PostgreSQL on `localhost:5432`, database `auction`, user `auction`, password `auction`) or `psql`:

```bash
psql postgres://auction:auction@localhost:5432/auction -c "select * from winners;"
```

### 3. Test accounts

Every team member creates their own test accounts. Do not share API keys, and never commit the `.env` file.

- **Stripe**: create an account at [stripe.com](https://stripe.com) and stay in test mode (sandbox). Copy the secret key (`sk_test_...`) from Developers → API keys.
- **Resend**: create an account at [resend.com](https://resend.com) and create an API key (`re_...`) with *Sending access* under API Keys.

Without a verified domain, Resend only delivers emails to the address of the account that owns the API key. When testing, use **the email of your own Resend account** as the bidder email.

### 4. Backend setup

```bash
cd auction-backend
cp .env.example .env
bun install
bun run src/migrate.ts
```

Fill in `.env`:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `postgres://auction:auction@localhost:5432/auction` |
| `STRIPE_SECRET_KEY` | your `sk_test_...` key |
| `STRIPE_WEBHOOK_SECRET` | the `whsec_...` printed by `stripe listen` (see below) |
| `RESEND_API_KEY` | your `re_...` key |
| `EMAIL_FROM` | `onboarding@resend.dev` |
| `FRONTEND_URL` | `http://localhost:5173` |

### 5. Frontend setup

```bash
cd auction-frontend
bun install
```

### 6. Run everything

Three terminals are needed:

```bash
# terminal 1: backend (http://localhost:3000)
cd auction-backend
bun --watch index.ts

# terminal 2: frontend (http://localhost:5173)
cd auction-frontend
bun run dev

# terminal 3: Stripe webhooks
stripe listen --events checkout.session.completed --forward-to localhost:3000/api/stripe/webhook
```

`stripe listen` prints a signing secret (`whsec_...`). Put it in `STRIPE_WEBHOOK_SECRET` in `auction-backend/.env` and restart the backend, because `--watch` does not reload the `.env` file.

### 7. Try the full flow

1. Open `http://localhost:5173`, enter the email of your Resend account and click Continue.
2. Place a bid and wait for the auction to end (120 seconds).
3. The winner receives the "You won the auction" email and a "Pay now" link appears on the page. A new row is created in the `winners` table with `status = pending_payment`.
4. Pay with the Stripe test card `4242 4242 4242 4242`, any future expiry date and any CVC.
5. The webhook marks the row as `paid`, and the winner receives the "Payment received" email.

To run another auction, restart the backend.

#### Stripe test cards
 
Use any future expiry date, any CVC and any postal code. These cards only work in test mode (sandbox).
 
| Card | What it simulates |
| --- | --- |
| `4242 4242 4242 4242` | Payment approved (Visa) |
| `5555 5555 5555 4444` | Payment approved (Mastercard) |
| `4000 0000 0000 0002` | Declined (generic decline) |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0000 0000 0069` | Declined (expired card) |
| `4000 0000 0000 0127` | Declined (incorrect CVC) |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |


## Sprint 0

- [Vision](docs/sprints/sprint-0/vision.md)
- [Definition of done](docs/sprints/sprint-0/definition-of-done.md)
- [MVP](docs/sprints/sprint-0/MVP.md)
- [AI log](docs/sprints/sprint-0/AI-log.md)
- [CLAIM](docs/sprints/sprint-0/CLAIM.md)