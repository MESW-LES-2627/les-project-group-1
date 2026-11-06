FROM oven/bun:1

WORKDIR /app

# The Prisma files must exist before `bun install`, because the postinstall
# script runs `prisma generate`, which reads them.
COPY package.json bun.lock ./
COPY prisma ./prisma
COPY prisma7.config.ts ./

# Prisma's config needs DATABASE_URL to load, even just to generate the client.
# This is a dummy value for the build only; the real one comes from docker-compose at runtime.
ARG DATABASE_URL=postgres://build:build@localhost:5432/build
RUN bun install --frozen-lockfile --production

COPY . .

ENV NODE_ENV=production \
    PORT=3000

EXPOSE 3000
CMD ["bun", "src/server.ts"]