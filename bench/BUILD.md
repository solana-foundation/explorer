> Sizes are gzipped, approximate, and rounded to reduce build-output noise. Next.js 16 (Turbopack) no longer prints sizes to stdout; these are derived by gzipping the first-load chunks listed in `.next/diagnostics/route-bundle-stats.json`. `Size` is First Load JS minus the chunks shared by all routes. Routes with no client JS (e.g. API routes) show `—`.

| Type | Route | Size | First Load JS |
|------|-------|------|---------------|
| Static | `/` | 130 kB | 1.16 MB |
| Static | `/_not-found` | 0 B | 1.03 MB |
| Dynamic | `/address/[address]` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/anchor-account` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/anchor-program` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/attestation` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/attributes` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/blockhashes` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/compression` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/concurrent-merkle-tree` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/domains` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/entries` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/feature-gate` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/idl` | 510 kB | 1.52 MB |
| Dynamic | `/address/[address]/instructions` | 420 kB | 1.44 MB |
| Dynamic | `/address/[address]/metadata` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/nftoken-collection-nfts` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/program-multisig` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/rewards` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/security` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/slot-hashes` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/stake-history` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/token-extensions` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/tokens` | 510 kB | 1.52 MB |
| Dynamic | `/address/[address]/transfers` | 420 kB | 1.44 MB |
| Dynamic | `/address/[address]/verified-build` | 370 kB | 1.39 MB |
| Dynamic | `/address/[address]/vote-history` | 370 kB | 1.39 MB |
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
| Dynamic | `/block/[slot]/accounts` | 230 kB | 1.25 MB |
| Dynamic | `/block/[slot]/programs` | 230 kB | 1.25 MB |
| Dynamic | `/block/[slot]/rewards` | 230 kB | 1.25 MB |
| Dynamic | `/epoch/[epoch]` | 10 kB | 1.04 MB |
| Static | `/feature-gates` | 50 kB | 1.07 MB |
| Dynamic | `/og/feature-gate/[address]` | — | — |
| Dynamic | `/og/receipt/[signature]` | — | — |
| Static | `/opengraph-image.png` | — | — |
| Static | `/tos` | 890 B | 1.03 MB |
| Dynamic | `/tx/[signature]` | 590 kB | 1.60 MB |
| Dynamic | `/tx/[signature]/inspect` | 360 kB | 1.38 MB |
| Static | `/tx/inspector` | 360 kB | 1.38 MB |