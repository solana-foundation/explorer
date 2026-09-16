> Gzipped first-load sizes from `.next/diagnostics/route-bundle-stats.json`, rounded to reduce noise; a cell keeps its previous value while fresh bytes round within one step of it. `Size` is First Load JS minus the chunks shared by all routes; routes with no client JS show `—`.

| Type | Route | Size | First Load JS |
|------|-------|------|---------------|
| Static | `/` | 140 kB | 550 kB |
| Static | `/_not-found` | 0 B | 420 kB |
| Dynamic | `/address/[address]` | 540 kB | 950 kB |
| Dynamic | `/address/[address]/account-data` | 540 kB | 960 kB |
| Dynamic | `/address/[address]/anchor-account` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/attestation` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/attributes` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/blockhashes` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/compression` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/concurrent-merkle-tree` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/domains` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/entries` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/feature-gate` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/idl` | 620 kB | 1.00 MB |
| Dynamic | `/address/[address]/instructions` | 510 kB | 930 kB |
| Dynamic | `/address/[address]/metadata` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/nftoken-collection-nfts` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/program-multisig` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/rewards` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/security` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/slot-hashes` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/stake-history` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/subscriptions` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/token-extensions` | 510 kB | 920 kB |
| Dynamic | `/address/[address]/tokens` | 510 kB | 930 kB |
| Dynamic | `/address/[address]/transfers` | 510 kB | 930 kB |
| Dynamic | `/address/[address]/verified-build` | 500 kB | 920 kB |
| Dynamic | `/address/[address]/vote-history` | 500 kB | 920 kB |
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
| Dynamic | `/block/[slot]` | 170 kB | 580 kB |
| Dynamic | `/block/[slot]/accounts` | 150 kB | 570 kB |
| Dynamic | `/block/[slot]/programs` | 150 kB | 570 kB |
| Dynamic | `/block/[slot]/rewards` | 160 kB | 570 kB |
| Dynamic | `/epoch/[epoch]` | 20 kB | 430 kB |
| Static | `/feature-gates` | 50 kB | 460 kB |
| Dynamic | `/mcp` | — | — |
| Static | `/mcp/start` | 30 kB | 440 kB |
| Dynamic | `/og/feature-gate/[address]` | — | — |
| Dynamic | `/og/receipt/[signature]` | — | — |
| Dynamic | `/og/tx/[signature]` | — | — |
| Static | `/opengraph-image.png` | — | — |
| Dynamic | `/robots.txt` | — | — |
| Static | `/tos` | 10 kB | 430 kB |
| Dynamic | `/tx/[signature]` | 550 kB | 960 kB |
| Dynamic | `/tx/[signature]/inspect` | 470 kB | 880 kB |
| Static | `/tx/inspector` | 470 kB | 880 kB |