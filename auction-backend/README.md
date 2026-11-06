# Backend

## Run

```bash
# 1. Install dependencies
bun install

# 2. Create .env and fill it in
cp .env.example .env

# 3. Create the database tables
bun run migrate

# 4. Create the first admin (needs ADMIN_EMAIL and ADMIN_PASSWORD in .env)
bun run seed:admin

# 5. Start the server
bun run dev
```
This project was created using `bun init` in bun v1.4.2. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
