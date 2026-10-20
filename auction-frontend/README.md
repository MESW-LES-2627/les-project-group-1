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
bun build
bun preview
```

## Source structure

```text
src/
  App.tsx                    # Application entry component
  main.tsx                   # React root and global stylesheet
  styles/global.css          # Tailwind import, theme tokens, and global defaults
  auction/
    AuctionApp.tsx           # Auction state and Socket.IO lifecycle
    AuctionPage.tsx          # Auction page composition
    data.ts                  # Static auction item content and constants
    types.ts                 # Auction and bid data types
    utils.ts                 # Formatting helpers
    components/              # Focused auction UI components
public/                      # Auction imagery and icons served as static files
```
