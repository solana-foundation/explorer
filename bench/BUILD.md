> Sizes are gzipped, approximate, and rounded to reduce build-output noise. Next.js 16 (Turbopack) no longer prints sizes to stdout; these are derived by gzipping the first-load chunks listed in `.next/diagnostics/route-bundle-stats.json`. `Size` is First Load JS minus the chunks shared by all routes. Routes with no client JS (e.g. API routes) show `—`.

| Type | Route | Size | First Load JS |
|------|-------|------|---------------|
| Static | `/` | 130 kB | 540 kB |
| Static | `/_not-found` | 0 B | 420 kB |
| Dynamic | `/address/[address]` | 510 kB | 920 kB |
| Dynamic | `/address/[address]/account-data` | 520 kB | 930 kB |
| Dynamic | `/address/[address]/anchor-account` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/anchor-program` | 470 kB | 890 kB |
| Dynamic | `/address/[address]/attestation` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/attributes` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/blockhashes` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/compression` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/concurrent-merkle-tree` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/domains` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/entries` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/feature-gate` | 470 kB | 890 kB |
| Dynamic | `/address/[address]/idl` | 610 kB | 1.00 MB |
| Dynamic | `/address/[address]/instructions` | 480 kB | 900 kB |
| Dynamic | `/address/[address]/metadata` | 470 kB | 890 kB |
| Dynamic | `/address/[address]/nftoken-collection-nfts` | 470 kB | 890 kB |
| Dynamic | `/address/[address]/program-multisig` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/rewards` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/security` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/slot-hashes` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/stake-history` | 470 kB | 890 kB |
| Dynamic | `/address/[address]/subscriptions` | 470 kB | 890 kB |
| Dynamic | `/address/[address]/token-extensions` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/tokens` | 490 kB | 900 kB |
| Dynamic | `/address/[address]/transfers` | 480 kB | 900 kB |
| Dynamic | `/address/[address]/verified-build` | 480 kB | 890 kB |
| Dynamic | `/address/[address]/vote-history` | 470 kB | 890 kB |
| Dynamic | `/api/ans-domains/[address]` | — | — |
| Dynamic | `/api/domain-info/[domain]` | — | — |
| Dynamic | `/api/geo-location` | — | — |
| Dynamic | `/api/idl-latest` | — | — |
| Dynamic | `/api/metadata/proxy` | — | — |
| Dynamic | `/api/ping/[network]` | — | — |
| Dynamic | `/api/search` | — | — |
| Dynamic | `/api/security-txt` | — | — |
| Dynamic | `/api/sns-domains/[address]` | — | — |
| Dynamic | `/api/stake-rewards/[address]` | — | — |
| Dynamic | `/api/token-image/[mintAddress]` | — | — |
| Dynamic | `/api/token-info` | — | — |
| Dynamic | `/api/token-market-data/[address]` | — | — |
| Dynamic | `/api/token-price/[mintAddress]` | — | — |
| Dynamic | `/api/verification/bluprynt/[mintAddress]` | — | — |
| Dynamic | `/api/verification/coingecko/[address]` | — | — |
| Dynamic | `/api/verification/jupiter/[mintAddress]` | — | — |
| Dynamic | `/api/verification/rugcheck/[mintAddress]` | — | — |
| Dynamic | `/block/[slot]` | 290 kB | 700 kB |
| Dynamic | `/block/[slot]/accounts` | 280 kB | 690 kB |
| Dynamic | `/block/[slot]/programs` | 280 kB | 690 kB |
| Dynamic | `/block/[slot]/rewards` | 280 kB | 690 kB |
| Dynamic | `/epoch/[epoch]` | 10 kB | 420 kB |
| Static | `/feature-gates` | 40 kB | 450 kB |
| Dynamic | `/mcp` | — | — |
| Static | `/mcp/start` | 20 kB | 430 kB |
| Dynamic | `/og/feature-gate/[address]` | — | — |
| Dynamic | `/og/receipt/[signature]` | — | — |
| Static | `/opengraph-image.png` | — | — |
| Static | `/tos` | 880 B | 420 kB |
| Dynamic | `/tx/[signature]` | 680 kB | 1.06 MB |
| Dynamic | `/tx/[signature]/inspect` | 470 kB | 880 kB |
| Static | `/tx/inspector` | 470 kB | 880 kB |