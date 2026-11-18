# Proposal: Decouple token market data from CoinGecko and fix verification via `gt_verified`

## Context

A single CoinGecko fetch (`/api/verification/coingecko/{address}` → `GET /coins/solana/contract/{address}?market_data=true`) currently serves **two unrelated jobs**:

1. **Market-data cards** — Price / 24h Volume / Market Cap, legitimately from CoinGecko `market_data`.
2. **The "CoinGecko verified" badge** — inferred from *"did we get market data back?"* (`use-verification-sources.ts`: `coingeckoVerified = coinInfo?.status === Success`).

Job 2 is **semantically wrong**: being *indexed* by CoinGecko (has trade data) is not the same as being *verified*. The real signal is `gt_verified` (boolean) on CoinGecko's on-chain token-info endpoint. Two consequences follow:

- Tokens listed without trade data return 404 from the market-data fetch today and are therefore shown **not verified**, even when `gt_verified` is `true`.
- Market data is locked to the CoinGecko namespace (`api/verification/coingecko`, badge feature), so swapping the price provider later is hard.

## Why

The badge and the price cards have independent data sources. Splitting them lets verification use the correct `gt_verified` signal while market data becomes a stable, provider-agnostic interface.

Alternatives considered:

- **Keep market-data presence as the verified signal** — rejected: it is the bug. Indexed ≠ verified, and it permanently mis-labels listed-without-trade-data tokens.
- **Keep the single existing route but make two upstream calls inside it** (Coins `market_data` + onchain `/info`, returning `{ …marketData, verified }`) — rejected: it fixes the *signal* but keeps the two concerns coupled at the route and client layers.
- **Threshold on `gt_score`** — rejected: the verified rule is `gt_verified === true` only; `gt_score` is not surfaced.

## What Changes

- **New provider-agnostic market-data feature** `app/features/token-market-data/` and route `/api/token-market-data/{address}` returning a `MarketData` shape (price required; market cap / volume / 24h-change / rank / last-updated optional). CoinGecko is the current implementation behind it; the market-data UI moves into the feature.
- **CoinGecko verification added** at `/api/verification/coingecko/{address}` to return `{ coinGeckoId?, verified }` — `verified` from `data.attributes.gt_verified`, `coinGeckoId` from `data.attributes.coingecko_coin_id` (the CoinGecko coin slug, `null` when the token isn't listed on coingecko.com, omitted from the response when absent).
- **CoinGecko verified-badge link fixed.** The badge now links to the coin's web page `https://www.coingecko.com/en/coins/{coinGeckoId}` when a `coinGeckoId` is present, else falls back to the GeckoTerminal token page `https://www.geckoterminal.com/solana/tokens/{address}` (the source of the `gt_verified` signal). (The coingecko.com route `/coins/solana/contract/{address}` returns 404s page)
- **Shared HTTP helpers moved** into `app/shared/lib/http-utils.ts`.
