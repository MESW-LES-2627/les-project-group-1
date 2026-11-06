# Frontend

React, TypeScript, Tailwind CSS, and Vite client for the live auction. We also use Stripe and Resend as external APIs for payment gateway and email sending.

## Development

```sh
bun install
bun dev
```

Available checks and production commands:

```sh
bun lint
bun test
bun run build
bun preview
```

## Source structure

```text
src/
  App.tsx                    # Route definitions
  main.tsx                   # React root and global stylesheet
  styles/global.css          # Tailwind import, theme tokens, and global defaults
  auction/                   # Auction state, Socket.IO lifecycle and /demo page
  catalogue/                 # Public catalogue, club and item pages, API client
  live/                      # Live auctions page
  profile/                   # Account page, API client and image helpers
  sports/                    # Sports browsing page
  charities/                 # Charities browsing page
  about/                     # About page
  support/                   # Support page
  components/                # Shared UI components (cards, forms, navbar, ...)
  components/ui/             # shadcn/ui primitives
  lib/utils.ts               # Shared utility helpers
public/                      # Auction imagery, icons and static assets
```

## Routes

| Path | Page |
| --- | --- |
| `/` | Public catalogue |
| `/auction/:id` | Item page with its live auction |
| `/club/:slug` | Club page |
| `/live` | Live auctions |
| `/sports` | Sports browsing |
| `/charities` | Charities browsing |
| `/about` | About |
| `/support` | Support |
| `/profile` | User account |
| `/reset-password` | Password reset |
| `/demo` | Auction prototype from iteration 0 |
