> Sizes are gzipped, approximate, and rounded to reduce build-output noise. Next.js 16 (Turbopack) no longer prints sizes to stdout; these are derived by gzipping the first-load chunks listed in `.next/diagnostics/route-bundle-stats.json`. `Size` is First Load JS minus the chunks shared by all routes. Routes with no client JS (e.g. API routes) show `—`.

| Type | Route | Size | First Load JS |
|------|-------|------|---------------|
| Static | `/` | 130 kB | 1.15 MB |
| Static | `/_not-found` | 0 B | 1.03 MB |
| Dynamic | `/address/[address]` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/anchor-account` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/anchor-program` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/attestation` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/attributes` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/blockhashes` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/compression` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/concurrent-merkle-tree` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/domains` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/entries` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/feature-gate` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/idl` | 470 kB | 1.49 MB |
| Dynamic | `/address/[address]/instructions` | 370 kB | 1.38 MB |
| Dynamic | `/address/[address]/metadata` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/nftoken-collection-nfts` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/program-multisig` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/rewards` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/security` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/slot-hashes` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/stake-history` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/token-extensions` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/tokens` | 450 kB | 1.47 MB |
| Dynamic | `/address/[address]/transfers` | 370 kB | 1.38 MB |
| Dynamic | `/address/[address]/verified-build` | 320 kB | 1.34 MB |
| Dynamic | `/address/[address]/vote-history` | 320 kB | 1.34 MB |
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
| Dynamic | `/api/token-info` | — | — |
| Dynamic | `/api/verification/bluprynt/[mintAddress]` | — | — |
| Dynamic | `/api/verification/coingecko/[address]` | — | — |
| Dynamic | `/api/verification/jupiter/[mintAddress]` | — | — |
| Dynamic | `/api/verification/rugcheck/[mintAddress]` | — | — |
| Dynamic | `/block/[slot]` | 230 kB | 1.25 MB |
| Dynamic | `/block/[slot]/accounts` | 220 kB | 1.24 MB |
| Dynamic | `/block/[slot]/programs` | 220 kB | 1.24 MB |
| Dynamic | `/block/[slot]/rewards` | 220 kB | 1.24 MB |
| Dynamic | `/epoch/[epoch]` | 10 kB | 1.04 MB |
| Static | `/feature-gates` | 40 kB | 1.07 MB |
| Dynamic | `/og/feature-gate/[address]` | — | — |
| Dynamic | `/og/receipt/[signature]` | — | — |
| Static | `/opengraph-image.png` | — | — |
| Static | `/tos` | 880 B | 1.03 MB |
| Dynamic | `/tx/[signature]` | 560 kB | 1.57 MB |
| Dynamic | `/tx/[signature]/inspect` | 350 kB | 1.36 MB |
| Static | `/tx/inspector` | 350 kB | 1.36 MB |