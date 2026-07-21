> Sizes are gzipped, approximate, and rounded to reduce build-output noise. Next.js 16 (Turbopack) no longer prints sizes to stdout; these are derived by gzipping the first-load chunks listed in `.next/diagnostics/route-bundle-stats.json`. `Size` is First Load JS minus the chunks shared by all routes. Routes with no client JS (e.g. API routes) show `—`.

| Type | Route | Size | First Load JS |
|------|-------|------|---------------|
| Static | `/` | 130 kB | 1.16 MB |
| Static | `/_not-found` | 0 B | 1.03 MB |
| Dynamic | `/address/[address]` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/anchor-account` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/anchor-program` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/attestation` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/attributes` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/blockhashes` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/compression` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/concurrent-merkle-tree` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/domains` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/entries` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/feature-gate` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/idl` | 500 kB | 1.52 MB |
| Dynamic | `/address/[address]/instructions` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/metadata` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/nftoken-collection-nfts` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/program-multisig` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/rewards` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/security` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/slot-hashes` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/stake-history` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/token-extensions` | 360 kB | 1.39 MB |
| Dynamic | `/address/[address]/tokens` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/transfers` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/verified-build` | 360 kB | 1.38 MB |
| Dynamic | `/address/[address]/vote-history` | 360 kB | 1.38 MB |
| Dynamic | `/api/ans-domains/[address]` | — | — |
| Dynamic | `/api/domain-info/[domain]` | — | — |
| Dynamic | `/api/geo-location` | — | — |
| Dynamic | `/api/idl-latest` | — | — |
| Dynamic | `/api/metadata/proxy` | — | — |
| Dynamic | `/api/ping/[network]` | — | — |
| Dynamic | `/api/receipt/price/[mintAddress]` | — | — |
| Dynamic | `/api/search` | — | — |
| Dynamic | `/api/security-txt` | — | — |
| Dynamic | `/api/sns-domains/[address]` | — | — |
| Dynamic | `/api/token-image/[mintAddress]` | — | — |
| Dynamic | `/api/token-info` | — | — |
| Dynamic | `/api/token-market-data/[address]` | — | — |
| Dynamic | `/api/verification/bluprynt/[mintAddress]` | — | — |
| Dynamic | `/api/verification/coingecko/[address]` | — | — |
| Dynamic | `/api/verification/jupiter/[mintAddress]` | — | — |
| Dynamic | `/api/verification/rugcheck/[mintAddress]` | — | — |
| Dynamic | `/block/[slot]` | 220 kB | 1.24 MB |
| Dynamic | `/block/[slot]/accounts` | 210 kB | 1.24 MB |
| Dynamic | `/block/[slot]/programs` | 210 kB | 1.24 MB |
| Dynamic | `/block/[slot]/rewards` | 210 kB | 1.24 MB |
| Dynamic | `/epoch/[epoch]` | 10 kB | 1.04 MB |
| Static | `/feature-gates` | 50 kB | 1.07 MB |
| Dynamic | `/mcp` | — | — |
| Dynamic | `/og/feature-gate/[address]` | — | — |
| Dynamic | `/og/receipt/[signature]` | — | — |
| Static | `/opengraph-image.png` | — | — |
| Static | `/tos` | 890 B | 1.04 MB |
| Dynamic | `/tx/[signature]` | 440 kB | 1.46 MB |
| Dynamic | `/tx/[signature]/inspect` | 360 kB | 1.38 MB |
| Static | `/tx/inspector` | 360 kB | 1.38 MB |