> Sizes are gzipped, approximate, and rounded to reduce build-output noise. Next.js 16 (Turbopack) no longer prints sizes to stdout; these are derived by gzipping the first-load chunks listed in `.next/diagnostics/route-bundle-stats.json`. `Size` is First Load JS minus the chunks shared by all routes. Routes with no client JS (e.g. API routes) show `—`.

| Type | Route | Size | First Load JS |
|------|-------|------|---------------|
| Static | `/` | 130 kB | 520 kB |
| Static | `/_not-found` | 0 B | 400 kB |
| Dynamic | `/address/[address]` | 500 kB | 890 kB |
| Dynamic | `/address/[address]/account-data` | 510 kB | 910 kB |
| Dynamic | `/address/[address]/anchor-account` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/anchor-program` | 470 kB | 860 kB |
| Dynamic | `/address/[address]/attestation` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/attributes` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/blockhashes` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/compression` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/concurrent-merkle-tree` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/domains` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/entries` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/feature-gate` | 470 kB | 860 kB |
| Dynamic | `/address/[address]/idl` | 590 kB | 990 kB |
| Dynamic | `/address/[address]/instructions` | 480 kB | 870 kB |
| Dynamic | `/address/[address]/metadata` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/nftoken-collection-nfts` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/program-multisig` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/rewards` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/security` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/slot-hashes` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/stake-history` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/subscriptions` | 470 kB | 860 kB |
| Dynamic | `/address/[address]/token-extensions` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/tokens` | 480 kB | 880 kB |
| Dynamic | `/address/[address]/transfers` | 480 kB | 880 kB |
| Dynamic | `/address/[address]/verified-build` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/vote-history` | 470 kB | 870 kB |
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
| Dynamic | `/block/[slot]` | 280 kB | 680 kB |
| Dynamic | `/block/[slot]/accounts` | 270 kB | 670 kB |
| Dynamic | `/block/[slot]/programs` | 270 kB | 670 kB |
| Dynamic | `/block/[slot]/rewards` | 270 kB | 670 kB |
| Dynamic | `/epoch/[epoch]` | 10 kB | 410 kB |
| Static | `/feature-gates` | 40 kB | 440 kB |
| Dynamic | `/mcp` | — | — |
| Static | `/mcp/start` | 20 kB | 420 kB |
| Dynamic | `/og/feature-gate/[address]` | — | — |
| Dynamic | `/og/receipt/[signature]` | — | — |
| Static | `/opengraph-image.png` | — | — |
| Static | `/tos` | 890 B | 410 kB |
| Dynamic | `/tx/[signature]` | 510 kB | 910 kB |
| Dynamic | `/tx/[signature]/inspect` | 450 kB | 850 kB |
| Static | `/tx/inspector` | 450 kB | 850 kB |