FROM oven/bun:1

WORKDIR /app

# Install only runtime dependencies; Bun runs the TypeScript source directly.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

COPY . .

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000

# Apply the idempotent schema before starting the server.
CMD ["sh", "-c", "bun run src/migrate.ts && exec bun run index.ts"]
