> Sizes are gzipped, approximate, and rounded to reduce build-output noise. Next.js 16 (Turbopack) no longer prints sizes to stdout; these are derived by gzipping the first-load chunks listed in `.next/diagnostics/route-bundle-stats.json`. `Size` is First Load JS minus the chunks shared by all routes. Routes with no client JS (e.g. API routes) show `—`.

| Type | Route | Size | First Load JS |
|------|-------|------|---------------|
| Static | `/` | 130 kB | 520 kB |
| Static | `/_not-found` | 0 B | 400 kB |
| Dynamic | `/address/[address]` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/account-data` | 500 kB | 900 kB |
| Dynamic | `/address/[address]/anchor-account` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/anchor-program` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/attestation` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/attributes` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/blockhashes` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/compression` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/concurrent-merkle-tree` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/domains` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/entries` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/feature-gate` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/idl` | 580 kB | 980 kB |
| Dynamic | `/address/[address]/instructions` | 460 kB | 860 kB |
| Dynamic | `/address/[address]/metadata` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/nftoken-collection-nfts` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/program-multisig` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/rewards` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/security` | 460 kB | 860 kB |
| Dynamic | `/address/[address]/slot-hashes` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/stake-history` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/subscriptions` | 450 kB | 850 kB |
| Dynamic | `/address/[address]/token-extensions` | 460 kB | 860 kB |
| Dynamic | `/address/[address]/tokens` | 470 kB | 870 kB |
| Dynamic | `/address/[address]/transfers` | 460 kB | 860 kB |
| Dynamic | `/address/[address]/verified-build` | 460 kB | 860 kB |
| Dynamic | `/address/[address]/vote-history` | 450 kB | 850 kB |
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
| Dynamic | `/block/[slot]` | 260 kB | 660 kB |
| Dynamic | `/block/[slot]/accounts` | 260 kB | 660 kB |
| Dynamic | `/block/[slot]/programs` | 260 kB | 660 kB |
| Dynamic | `/block/[slot]/rewards` | 260 kB | 660 kB |
| Dynamic | `/epoch/[epoch]` | 10 kB | 410 kB |
| Static | `/feature-gates` | 40 kB | 440 kB |
| Dynamic | `/mcp` | — | — |
| Static | `/mcp/start` | 20 kB | 420 kB |
| Dynamic | `/og/feature-gate/[address]` | — | — |
| Dynamic | `/og/receipt/[signature]` | — | — |
| Static | `/opengraph-image.png` | — | — |
| Static | `/tos` | 880 B | 410 kB |
| Dynamic | `/tx/[signature]` | 530 kB | 930 kB |
| Dynamic | `/tx/[signature]/inspect` | 450 kB | 850 kB |
| Static | `/tx/inspector` | 450 kB | 850 kB |