# CLAUDE.md — NFT aWallet

## Project Overview

NFT aWallet is a **Farcaster Mini App** that lets users view and manage their NFT collection on the **Base** L2 network. It runs inside the Farcaster client (Warpcast) as a mini app, connecting to the user's wallet to display ETH balance, NFTs, floor prices, and supports sending NFTs to other Farcaster users.

- **Live URL:** `https://nft-awallet.vercel.app`
- **Farcaster Mini App ID:** `019a6d9c-89a4-e79a-362a-6736ba4333d3`
- **Current Version:** v1.6
- **Creator:** [@lxc5m on Warpcast](https://warpcast.com/lxc5m)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.8 (strict mode) |
| React | React 19 |
| Styling | Tailwind CSS v4 + CSS variables (oklch color space) |
| UI Components | shadcn/ui (new-york style, Radix primitives) |
| Icons | lucide-react |
| Charts | recharts |
| Blockchain | ethers.js v6, Base network (L2) |
| Farcaster SDK | `@farcaster/miniapp-sdk` |
| Forms | react-hook-form + zod |
| Deployment | Vercel |
| Analytics | @vercel/analytics |
| Package Manager | pnpm |

## Commands

```bash
pnpm dev          # Start development server
pnpm build        # Production build (Next.js)
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

**Note:** `next.config.mjs` has `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true` — the build will succeed even with type/lint errors. Always run `pnpm lint` separately.

## Project Structure

```
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout: metadata, fonts, FarcasterProvider, Analytics
│   ├── page.tsx                  # Home page: wallet balance + NFT grid + selection actions
│   ├── providers.tsx             # FarcasterProvider context (SDK init, wallet, balance)
│   ├── head.tsx                  # Base app_id meta tag
│   ├── globals.css               # Tailwind v4 imports + CSS variables (light theme only)
│   ├── hidden/page.tsx           # Hidden/spam NFTs page
│   ├── debug/page.tsx            # Debug page for Alchemy API testing
│   ├── nft/[contract]/[tokenId]/ # NFT detail page (dynamic route)
│   │   ├── page.tsx              # Detail view: image, traits, price chart, actions
│   │   └── loading.tsx           # Loading state (returns null)
│   └── api/                      # API routes (server-side)
│       ├── nfts/route.ts         # Fetch NFTs for wallet (Alchemy) + sales history
│       ├── opensea-data/route.ts # OpenSea collection stats (floor, supply, description)
│       ├── price-history/route.ts      # Floor price history (Reservoir API)
│       ├── flow-price-history/route.ts # Floor price history (alternate source)
│       ├── mint-nft/route.ts     # NFT minting endpoint (stub/TODO)
│       ├── feedback/route.ts     # Feedback submission endpoint
│       └── webhook/route.ts      # Farcaster webhook handler (frame events)
├── components/
│   ├── wallet-balance.tsx        # Wallet balance card (ETH + NFT stats)
│   ├── nft-grid.tsx              # NFT grid/list display with sorting + selection
│   ├── send-nft-modal.tsx        # Send NFT modal (Neynar user search, ERC-721 transfer)
│   ├── menu-dropdown.tsx         # App menu (About, Cast Feedback, Donate)
│   ├── theme-provider.tsx        # next-themes provider wrapper (not currently used in layout)
│   ├── modals/
│   │   ├── about-modal.tsx       # About dialog (version, creator, links)
│   │   ├── donate-modal.tsx      # Donate ETH dialog (sends ETH via Farcaster wallet)
│   │   ├── mint-modal.tsx        # Mint NFT dialog (calls /api/mint-nft)
│   │   ├── feedback-modal.tsx    # Feedback dialog (opens Farcaster composer)
│   │   └── whats-new-modal.tsx   # Changelog dialog (reads from data/changelog.ts)
│   └── ui/                       # shadcn/ui components (do not edit manually)
├── hooks/
│   ├── use-eth-price.ts          # ETH price hook (CoinGecko API, 60s refresh)
│   ├── use-mobile.ts             # Mobile breakpoint detection (768px)
│   └── use-toast.ts              # Toast notification hook (shadcn)
├── lib/
│   └── utils.ts                  # cn() utility (clsx + tailwind-merge)
├── data/
│   └── changelog.ts              # Changelog entries (ChangelogEntry[] type)
├── styles/
│   └── globals.css               # Alternate CSS with dark mode support (neutral base)
├── public/                       # Static assets (icons, splash, embed images)
├── .well-known/
│   └── farcaster.json            # Farcaster mini app manifest
└── Configuration files
    ├── next.config.mjs           # Next.js config (ESLint/TS errors ignored)
    ├── tsconfig.json             # TypeScript config (strict, @/* path alias)
    ├── postcss.config.mjs        # PostCSS with @tailwindcss/postcss
    ├── components.json           # shadcn/ui config (new-york style, RSC)
    ├── vercel.json               # Redirect /.well-known/farcaster.json to hosted manifest
    └── package.json              # Dependencies and scripts
```

## Architecture & Key Patterns

### Farcaster SDK Integration (`app/providers.tsx`)

The `FarcasterProvider` is the central context provider that wraps the entire app. It:
1. Initializes `@farcaster/miniapp-sdk` and calls `sdk.actions.ready()`
2. Reads the Farcaster frame context to get the user's wallet address
3. Fetches ETH balance from Base network via JSON-RPC (`https://mainnet.base.org`)
4. Persists wallet connection in `localStorage` (`farcaster_wallet_address`, `farcaster_wallet_connected`)
5. Exposes `useFarcaster()` hook with: `isSDKLoaded`, `context`, `walletAddress`, `ethBalance`, `connectWallet`, `isWalletConnected`, `sdk`, `isInFarcaster`

### State Management

- **No external state library** — all state is managed via React `useState`/`useEffect` and React Context
- **localStorage keys used:**
  - `farcaster_wallet_address` — persisted wallet address
  - `farcaster_wallet_connected` — connection status flag
  - `hidden_nfts` — JSON array of hidden NFT IDs (`{contractAddress}-{tokenId}`)
  - `recentNFTRecipients` — JSON array of recent send recipients

### NFT Data Flow

1. `app/page.tsx` reads wallet address from `useFarcaster()`
2. Calls `/api/nfts?address={wallet}` which fetches from Alchemy NFT API v3
3. NFTs are formatted into a local `NFT` interface and filtered against `hidden_nfts` localStorage
4. Spam NFTs (flagged by Alchemy `isSpam` or keyword matching) are auto-hidden
5. NFT detail data is passed via URL query params as encoded JSON (`?data={encodedJSON}`)

### NFT Sending (ERC-721 Transfer)

The `SendNFTModal` manually constructs `safeTransferFrom` calldata:
- Function selector: `0x42842e0e` (ERC-721 `safeTransferFrom(address,address,uint256)`)
- Sends via `farcasterSdk.wallet.ethProvider.request({ method: "eth_sendTransaction" })`
- User search uses **Neynar API** (`api.neynar.com`) with a public demo key

### Styling Conventions

- **Light theme only** in production (`app/globals.css` — no `.dark` variant)
- Colors use **oklch** color space via CSS custom properties
- shadcn/ui semantic tokens: `bg-background`, `text-foreground`, `bg-card`, `text-muted-foreground`, `bg-primary`, etc.
- Tailwind v4 with `@tailwindcss/postcss` plugin
- Font: Geist (sans) and Geist Mono

### Component Conventions

- All page and interactive components use `"use client"` directive
- shadcn/ui components live in `components/ui/` — treat as library code, do not edit directly
- Custom components use shadcn/ui primitives (Button, Card, Dialog, Input, etc.)
- Modals follow a consistent pattern: `open`/`onOpenChange` props with `Dialog` wrapper

## Environment Variables

| Variable | Used In | Required |
|----------|---------|----------|
| `ALCHEMY_API_KEY` | `app/api/nfts/route.ts` | Yes (server-side) |
| `OPENSEA_API_KEY` | `app/api/opensea-data/route.ts` | Yes (server-side) |
| `NEXT_PUBLIC_ALCHEMY_BASE` | `app/debug/page.tsx` | Debug only |
| `NEXT_PUBLIC_ALCHEMY_KEY` | `app/debug/page.tsx` | Debug only |

## External APIs

| API | Purpose | Endpoint Pattern |
|-----|---------|-----------------|
| Alchemy NFT v3 | Fetch owned NFTs, sales history | `base-mainnet.g.alchemy.com/nft/v3/{key}/...` |
| OpenSea v2 | Collection stats, floor price | `api.opensea.io/api/v2/...` |
| Reservoir | Floor price history | `api.reservoir.tools/collections/...` |
| CoinGecko | ETH/USD price | `api.coingecko.com/api/v3/simple/price` |
| Neynar | Farcaster user search | `api.neynar.com/v2/farcaster/user/...` |
| Base RPC | ETH balance | `mainnet.base.org` (JSON-RPC) |

## Path Aliases

TypeScript path alias `@/*` maps to the project root:
```typescript
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useFarcaster } from "@/app/providers"
```

## Key Development Notes

1. **All blockchain operations target Base network** — contract addresses, RPC calls, and explorer links all use Base (chain ID 8453).

2. **NFT data is passed via URL params** — the NFT detail page receives its data as an encoded JSON query parameter rather than fetching it server-side. This means navigating directly to an NFT detail URL without the `data` param shows "NFT not found."

3. **The mint endpoint is a stub** — `app/api/mint-nft/route.ts` has a TODO and returns a mock transaction hash.

4. **Hidden NFTs are device-local** — stored in `localStorage`, so hiding an NFT on one device won't reflect on another.

5. **Console logging uses `[v0]` prefix** — this is a convention from v0.app code generation. Use this prefix for consistency when adding new logs.

6. **No test suite** — the project has no testing framework configured.

7. **The app uses two CSS files** — `app/globals.css` (active, light-only with blue-purple accent) and `styles/globals.css` (inactive, has dark mode, neutral palette). The active one is imported in `app/layout.tsx`.

8. **Farcaster manifest** — `.well-known/farcaster.json` defines the mini app metadata. The `vercel.json` redirect points this path to the hosted manifest on `api.farcaster.xyz`.

9. **Images are unoptimized** — `next.config.mjs` sets `images.unoptimized: true`, so Next.js Image component doesn't use the optimization API.
