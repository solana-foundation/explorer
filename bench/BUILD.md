> Gzipped first-load sizes from `.next/diagnostics/route-bundle-stats.json`, rounded to reduce noise; a cell keeps its previous value while fresh bytes round within one step of it. `Size` is First Load JS minus the chunks shared by all routes; routes with no client JS show `—`.

| Type | Route | Size | First Load JS |
|------|-------|------|---------------|
| Static | `/` | 130 kB | 570 kB |
| Static | `/_not-found` | 0 B | 450 kB |
| Dynamic | `/address/[address]` | 430 kB | 880 kB |
| Dynamic | `/address/[address]/account-data` | 440 kB | 890 kB |
| Dynamic | `/address/[address]/anchor-account` | 400 kB | 850 kB |
| Dynamic | `/address/[address]/attestation` | 400 kB | 850 kB |
| Dynamic | `/address/[address]/attributes` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/blockhashes` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/compression` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/concurrent-merkle-tree` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/domains` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/entries` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/feature-gate` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/idl` | 530 kB | 980 kB |
| Dynamic | `/address/[address]/instructions` | 400 kB | 850 kB |
| Dynamic | `/address/[address]/metadata` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/nftoken-collection-nfts` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/program-multisig` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/rewards` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/security` | 400 kB | 850 kB |
| Dynamic | `/address/[address]/slot-hashes` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/stake-history` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/subscriptions` | 400 kB | 840 kB |
| Dynamic | `/address/[address]/token-extensions` | 400 kB | 850 kB |
| Dynamic | `/address/[address]/tokens` | 410 kB | 860 kB |
| Dynamic | `/address/[address]/transfers` | 410 kB | 850 kB |
| Dynamic | `/address/[address]/verified-build` | 400 kB | 850 kB |
| Dynamic | `/address/[address]/vote-history` | 400 kB | 840 kB |
| Dynamic | `/api/ans-domains/[address]` | — | — |
| Dynamic | `/api/domain-info/[domain]` | — | — |
| Dynamic | `/api/geo-location` | — | — |
| Dynamic | `/api/idl-latest` | — | — |
| Dynamic | `/api/log-drain` | — | — |
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
| Dynamic | `/api/verification/coingecko/[address]` | — | — |
| Dynamic | `/api/verification/jupiter/[mintAddress]` | — | — |
| Dynamic | `/api/verification/rugcheck/[mintAddress]` | — | — |
| Dynamic | `/block/[slot]` | 160 kB | 600 kB |
| Dynamic | `/block/[slot]/accounts` | 140 kB | 590 kB |
| Dynamic | `/block/[slot]/programs` | 140 kB | 590 kB |
| Dynamic | `/block/[slot]/rewards` | 150 kB | 590 kB |
| Dynamic | `/epoch/[epoch]` | 20 kB | 470 kB |
| Static | `/feature-gates` | 50 kB | 500 kB |
| Dynamic | `/mcp` | — | — |
| Static | `/mcp/start` | 20 kB | 470 kB |
| Dynamic | `/og/feature-gate/[address]` | — | — |
| Dynamic | `/og/receipt/[signature]` | — | — |
| Dynamic | `/og/tx/[signature]` | — | — |
| Static | `/opengraph-image.png` | — | — |
| Dynamic | `/robots.txt` | — | — |
| Static | `/tos` | 10 kB | 460 kB |
| Dynamic | `/tx/[signature]` | 460 kB | 910 kB |
| Dynamic | `/tx/[signature]/inspect` | 450 kB | 900 kB |
| Static | `/tx/inspector` | 450 kB | 900 kB |