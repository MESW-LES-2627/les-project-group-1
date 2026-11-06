# Backend

## Run

```bash
# 1. Install dependencies
bun install

# 2. Create .env and fill it in
cp .env.example .env

# 3. Create the database tables
bun run migrate

# 4. Optionally load the demo catalogue
bun run seed

# 5. Create the first admin (needs ADMIN_EMAIL and ADMIN_PASSWORD in .env)
bun run seed:admin

# 6. Start the server
bun run dev
```

The server listens on `http://localhost:3000`. During development, use `bun run migrate:dev` after changing `prisma/schema.prisma`; `bun run migrate` applies existing migrations (used in production/CI).

## Source structure

```text
src/
  server.ts            # Entry point: starts the HTTP server and auction timer
  app.ts               # Express + Socket.IO setup (no listening, so tests can import it)
  config/              # Environment, database and Prisma client setup
  routes/              # API routers, mounted under /api
  controllers/         # Request handlers, including the Socket.IO auction handler
  services/            # Business logic: auction, listings, email, Stripe, tokens
  models/              # Prisma-backed data access
  middlewares/         # Authentication, role checks and error handling
  utils/               # Shared helpers (profile validation)
prisma/
  schema.prisma        # User, Address, Club, Category, Listing and Winner models
  migrations/          # SQL migrations applied with `bun run migrate`
seeds/
  demo.sql             # Demo clubs, categories and listings (`bun run seed`)
  admin-seed.ts        # First admin account (`bun run seed:admin`)
tests/                 # Bun tests (auth, users, profile, auction reset)
```

## API overview

All JSON routes are mounted under `/api`; the Stripe webhook is mounted separately at `/api/stripe/webhook` so it can receive the raw request body.

| Prefix | Routes |
| --- | --- |
| `/api/auth` | register, login, logout, forgot password, reset password |
| `/api/auction` | reset the demo auction |
| `/api/users` | current user profile, purchases, avatar |
| `/api` | categories, listings, listing detail and club catalogue |
| `/api/admin` | user management (requires the `ADMIN` role) |
| `/api/addresses` | shipping address CRUD (requires authentication) |
| `/api/stripe` | Stripe webhook |

This project was created using `bun init` in bun v1.4.2. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
