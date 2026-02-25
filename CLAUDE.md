# CLAUDE.md — NFT aWallet

## Project

NFT aWallet — Farcaster Mini App + Base App для просмотра и отправки NFT.

- URL: https://nft-awallet.vercel.app
- GitHub: lxcm5/fc-miniapp-nft-v2
- Deploy: Vercel

## Stack

Next.js 16 (App Router), TypeScript, React 19, Tailwind CSS v4, shadcn/ui, recharts, @farcaster/miniapp-sdk, ethers.js v6, pnpm.

## Commands

```bash
pnpm dev       # Dev server
pnpm build     # Production build
pnpm lint      # ESLint
pnpm start     # Start production
```

Build игнорирует TS/ESLint ошибки (`next.config.mjs` — `ignoreBuildErrors: true`, `ignoreDuringBuilds: true`). Всегда запускай `pnpm lint` отдельно.

## Environment Variables

| Переменная | Где используется | Обязательна |
|---|---|---|
| `ALCHEMY_API_KEY` | `app/api/nfts/route.ts`, `app/api/opensea-data/route.ts` | Да (server) |
| `OPENSEA_API_KEY` | `app/api/opensea-data/route.ts` | Да (server) |
| `NEYNAR_API_KEY` | `app/api/farcaster-search/route.ts` | Да (server) |
| `NEXT_PUBLIC_ALCHEMY_KEY` | `app/debug/page.tsx` | Только для debug |
| `NEXT_PUBLIC_ALCHEMY_BASE` | `app/debug/page.tsx` | Только для debug |

## Features

- Просмотр NFT коллекции (Base chain) через Alchemy NFT API v3
- ETH баланс с USD конвертацией (CoinGecko)
- Отправка NFT — поддержка ERC-721 и ERC-1155 (разные ABI selectors)
- Hidden NFTs — скрытие спам/скам NFT (localStorage, device-local)
- Автоматический фильтр скам NFT (Alchemy `isSpam`, ключевые слова: claim/reward/airdrop)
- График цены флора (recharts)
- Поиск получателей через Neynar API (Farcaster username/address)
- Donate, Feedback, About модалки
- Farcaster webhook handler (`/api/webhook`)

## Structure

```
app/
  layout.tsx              # Root layout, FarcasterProvider, Vercel Analytics
  page.tsx                # Главная: баланс + NFT grid + bulk actions
  providers.tsx           # FarcasterProvider — SDK init, wallet, balance (useFarcaster hook)
  globals.css             # Tailwind v4 + CSS variables (oklch, light theme)
  hidden/page.tsx         # Скрытые NFT
  debug/page.tsx          # Debug Alchemy API
  nft/[contract]/[tokenId]/page.tsx  # Детали NFT: image, traits, chart, send/hide
  api/
    nfts/route.ts             # GET: NFT list (Alchemy getNFTsForOwner) + sales history (getNFTSales)
    opensea-data/route.ts     # GET: collection stats (OpenSea v2)
    price-history/route.ts    # GET: floor price history (вызывает flow-price-history)
    flow-price-history/route.ts # GET: floor price events (Reservoir API)
    mint-nft/route.ts         # POST: stub — NFT minting (TODO)
    farcaster-search/route.ts # GET: Farcaster user search proxy (Neynar)
    feedback/route.ts         # POST: feedback log
    webhook/route.ts          # POST: Farcaster webhook events

components/
  wallet-balance.tsx      # Карточка ETH баланса + NFT статистика
  nft-grid.tsx            # Grid/List NFT с сортировкой, long-press selection, spam фильтр
  send-nft-modal.tsx      # Отправка NFT: поиск Neynar, ERC-721/ERC-1155 transfer
  menu-dropdown.tsx       # Меню (About, Cast Feedback, Donate)
  modals/                 # about, donate, mint, feedback, whats-new
  ui/                     # shadcn/ui — НЕ редактировать вручную

hooks/
  use-eth-price.ts        # ETH/USD цена (CoinGecko, обновление каждые 60с)
  use-mobile.ts           # Mobile detection (768px)

lib/utils.ts              # cn() — clsx + tailwind-merge
data/changelog.ts         # Changelog entries для What's New модалки
```

## NFT Sending — ERC-721 vs ERC-1155

`tokenType` приходит из Alchemy API (`contract.tokenType`) и прокидывается через `nft-grid.tsx` -> URL params -> `send-nft-modal.tsx`.

```
ERC-721:  selector 0x42842e0e — safeTransferFrom(address,address,uint256)
ERC-1155: selector 0xf242432a — safeTransferFrom(address,address,uint256,uint256,bytes)
          amount=1, data=empty
```

Calldata формируется вручную в `send-nft-modal.tsx`, отправляется через `farcasterSdk.wallet.ethProvider.request({ method: "eth_sendTransaction" })`.

## External APIs

| API | Назначение |
|---|---|
| Alchemy NFT v3 | NFT list, sales history (`base-mainnet.g.alchemy.com`) |
| OpenSea v2 | Collection floor, stats, description |
| Reservoir | Floor price history (90 дней) |
| CoinGecko | ETH/USD курс |
| Neynar | Поиск Farcaster пользователей по username/address |
| Base RPC | ETH баланс (`mainnet.base.org`, JSON-RPC) |

## Known Issues / TODO

1. **График флора использует заглушку** — в `app/nft/[contract]/[tokenId]/page.tsx` переменная `floorPriceHistory` захардкожена массивом. Endpoint `/api/nfts?history=true&contractAddress=...` уже готов (Alchemy `getNFTSales`), нужно подключить к UI вместо заглушки.

2. ~~**Neynar demo ключ**~~ — **РЕШЕНО**: запросы к Neynar проксируются через `/api/farcaster-search/route.ts` с `process.env.NEYNAR_API_KEY`.

3. **Mint endpoint — stub** — `app/api/mint-nft/route.ts` возвращает фейковый tx hash, логика не реализована.

4. **Hidden NFTs — device-local** — хранятся в `localStorage`, не синхронизируются между устройствами.

5. **NFT data через URL params** — деталь NFT получает данные как `?data={encodedJSON}`. Прямой переход по URL без параметра покажет "NFT not found".

## Language

**The app language is English only.** This applies to everything without exception:
- All UI text, labels, placeholders, button text, error messages, toast notifications
- All code comments
- Variable names, function names, type names
- Console log messages
- This CLAUDE.md file itself

Do not use Russian or any other language anywhere in the codebase.

## Conventions

- All pages and interactive components — `"use client"`
- Path alias: `@/*` -> project root (`@/components/...`, `@/lib/...`, `@/app/...`)
- Console logging with prefix `[v0]`
- `components/ui/` — shadcn/ui, do not edit manually
- Modals: pattern `open`/`onOpenChange` props + `Dialog` wrapper
- Blockchain — Base network only (chain ID 8453)
- CSS — oklch colors, light theme only, Geist font
