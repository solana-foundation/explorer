> Sizes are gzipped, approximate, and rounded to reduce build-output noise. Next.js 16 (Turbopack) no longer prints sizes to stdout; these are derived by gzipping the first-load chunks listed in `.next/diagnostics/route-bundle-stats.json`. `Size` is First Load JS minus the chunks shared by all routes. Routes with no client JS (e.g. API routes) show `—`.

| Type | Route | Size | First Load JS |
|------|-------|------|---------------|
| Static | `/` | 110 kB | 1.13 MB |
| Static | `/_not-found` | 0 B | 1.03 MB |
| Dynamic | `/address/[address]` | 430 kB | 1.44 MB |
| Dynamic | `/address/[address]/anchor-account` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/anchor-program` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/attestation` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/attributes` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/blockhashes` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/compression` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/concurrent-merkle-tree` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/domains` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/entries` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/feature-gate` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/idl` | 520 kB | 1.53 MB |
| Dynamic | `/address/[address]/instructions` | 430 kB | 1.44 MB |
| Dynamic | `/address/[address]/metadata` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/nftoken-collection-nfts` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/program-multisig` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/rewards` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/security` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/slot-hashes` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/stake-history` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/token-extensions` | 380 kB | 1.40 MB |
| Dynamic | `/address/[address]/tokens` | 510 kB | 1.52 MB |
| Dynamic | `/address/[address]/transfers` | 430 kB | 1.44 MB |
| Dynamic | `/address/[address]/verified-build` | 380 kB | 1.39 MB |
| Dynamic | `/address/[address]/vote-history` | 380 kB | 1.39 MB |
| Dynamic | `/api/anchor` | — | — |
| Dynamic | `/api/ans-domains/[address]` | — | — |
| Dynamic | `/api/domain-info/[domain]` | — | — |
| Dynamic | `/api/geo-location` | — | — |
| Dynamic | `/api/metadata/proxy` | — | — |
| Dynamic | `/api/ping/[network]` | — | — |
| Dynamic | `/api/program-metadata-idl` | — | — |
| Dynamic | `/api/receipt/price/[mintAddress]` | — | — |
| Dynamic | `/api/search` | — | — |
| Dynamic | `/api/sns-domains/[address]` | — | — |
| Dynamic | `/api/token-info` | — | — |
| Dynamic | `/api/verification/bluprynt/[mintAddress]` | — | — |
| Dynamic | `/api/verification/coingecko/[address]` | — | — |
| Dynamic | `/api/verification/jupiter/[mintAddress]` | — | — |
| Dynamic | `/api/verification/rugcheck/[mintAddress]` | — | — |
| Dynamic | `/block/[slot]` | 220 kB | 1.23 MB |
| Dynamic | `/block/[slot]/accounts` | 210 kB | 1.23 MB |
| Dynamic | `/block/[slot]/programs` | 210 kB | 1.23 MB |
| Dynamic | `/block/[slot]/rewards` | 210 kB | 1.23 MB |
| Dynamic | `/epoch/[epoch]` | 10 kB | 1.03 MB |
| Static | `/feature-gates` | 40 kB | 1.06 MB |
| Dynamic | `/og/feature-gate/[address]` | — | — |
| Dynamic | `/og/receipt/[signature]` | — | — |
| Static | `/opengraph-image.png` | — | — |
| Static | `/tos` | 880 B | 1.03 MB |
| Dynamic | `/tx/[signature]` | 590 kB | 1.59 MB |
| Dynamic | `/tx/[signature]/inspect` | 380 kB | 1.39 MB |
| Static | `/tx/inspector` | 380 kB | 1.39 MB |