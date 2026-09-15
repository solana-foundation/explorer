> Gzipped first-load sizes from `.next/diagnostics/route-bundle-stats.json`, rounded to reduce noise; a cell keeps its previous value while fresh bytes round within one step of it. `Size` is First Load JS minus the chunks shared by all routes; routes with no client JS show `—`.

| Type | Route | Size | First Load JS |
|------|-------|------|---------------|
| Static | `/` | 130 kB | 540 kB |
| Static | `/_not-found` | 0 B | 410 kB |
| Dynamic | `/address/[address]` | 520 kB | 920 kB |
| Dynamic | `/address/[address]/account-data` | 540 kB | 940 kB |
| Dynamic | `/address/[address]/anchor-account` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/attestation` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/attributes` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/blockhashes` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/compression` | 490 kB | 900 kB |
| Dynamic | `/address/[address]/concurrent-merkle-tree` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/domains` | 490 kB | 900 kB |
| Dynamic | `/address/[address]/entries` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/feature-gate` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/idl` | 610 kB | 0.99 MB |
| Dynamic | `/address/[address]/instructions` | 500 kB | 900 kB |
| Dynamic | `/address/[address]/metadata` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/nftoken-collection-nfts` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/program-multisig` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/rewards` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/security` | 500 kB | 900 kB |
| Dynamic | `/address/[address]/slot-hashes` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/stake-history` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/subscriptions` | 490 kB | 890 kB |
| Dynamic | `/address/[address]/token-extensions` | 500 kB | 900 kB |
| Dynamic | `/address/[address]/tokens` | 510 kB | 910 kB |
| Dynamic | `/address/[address]/transfers` | 500 kB | 900 kB |
| Dynamic | `/address/[address]/verified-build` | 500 kB | 900 kB |
| Dynamic | `/address/[address]/vote-history` | 490 kB | 890 kB |
| Dynamic | `/api/ans-domains/[address]` | — | — |
| Dynamic | `/api/domain-info/[domain]` | — | — |
| Dynamic | `/api/geo-location` | — | — |
| Dynamic | `/api/idl-latest` | — | — |
| Dynamic | `/api/metadata/proxy` | — | — |
| Dynamic | `/api/ping/[network]` | — | — |
| Dynamic | `/api/search` | — | — |
| Dynamic | `/api/security-txt` | — | — |
| Dynamic | `/api/slot-time` | — | — |
| Dynamic | `/api/sns-domains/[address]` | — | — |
| Dynamic | `/api/stake-rewards/[address]` | — | — |
| Dynamic | `/api/supply` | — | — |
| Dynamic | `/api/token-image/[mintAddress]` | — | — |
| Dynamic | `/api/token-info` | — | — |
| Dynamic | `/api/token-market-data/[address]` | — | — |
| Dynamic | `/api/token-price/[mintAddress]` | — | — |
| Dynamic | `/api/verification/bluprynt/[mintAddress]` | — | — |
| Dynamic | `/api/verification/coingecko/[address]` | — | — |
| Dynamic | `/api/verification/jupiter/[mintAddress]` | — | — |
| Dynamic | `/api/verification/rugcheck/[mintAddress]` | — | — |
| Dynamic | `/block/[slot]` | 160 kB | 570 kB |
| Dynamic | `/block/[slot]/accounts` | 150 kB | 550 kB |
| Dynamic | `/block/[slot]/programs` | 150 kB | 550 kB |
| Dynamic | `/block/[slot]/rewards` | 160 kB | 560 kB |
| Dynamic | `/epoch/[epoch]` | 20 kB | 420 kB |
| Static | `/feature-gates` | 50 kB | 450 kB |
| Dynamic | `/mcp` | — | — |
| Static | `/mcp/start` | 30 kB | 430 kB |
| Dynamic | `/og/feature-gate/[address]` | — | — |
| Dynamic | `/og/receipt/[signature]` | — | — |
| Dynamic | `/og/tx/[signature]` | — | — |
| Static | `/opengraph-image.png` | — | — |
| Static | `/tos` | 10 kB | 410 kB |
| Dynamic | `/tx/[signature]` | 540 kB | 940 kB |
| Dynamic | `/tx/[signature]/inspect` | 460 kB | 860 kB |
| Static | `/tx/inspector` | 460 kB | 860 kB |