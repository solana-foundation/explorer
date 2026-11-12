> Gzipped first-load sizes from `.next/diagnostics/route-bundle-stats.json`, rounded to reduce noise; a cell keeps its previous value while fresh bytes round within one step of it. `Size` is First Load JS minus the chunks shared by all routes; routes with no client JS show `—`.

| Type | Route | Size | First Load JS |
|------|-------|------|---------------|
| Static | `/` | 130 kB | 430 kB |
| Static | `/_not-found` | 0 B | 310 kB |
| Dynamic | `/address/[address]` | 550 kB | 850 kB |
| Dynamic | `/address/[address]/account-data` | 560 kB | 860 kB |
| Dynamic | `/address/[address]/anchor-account` | 520 kB | 820 kB |
| Dynamic | `/address/[address]/attestation` | 520 kB | 820 kB |
| Dynamic | `/address/[address]/attributes` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/blockhashes` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/compression` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/concurrent-merkle-tree` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/domains` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/entries` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/feature-gate` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/idl` | 620 kB | 930 kB |
| Dynamic | `/address/[address]/metadata` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/nftoken-collection-nfts` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/program-multisig` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/rewards` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/security` | 520 kB | 820 kB |
| Dynamic | `/address/[address]/slot-hashes` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/stake-history` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/subscriptions` | 510 kB | 820 kB |
| Dynamic | `/address/[address]/token-extensions` | 520 kB | 820 kB |
| Dynamic | `/address/[address]/tokens` | 530 kB | 830 kB |
| Dynamic | `/address/[address]/transfers` | 520 kB | 830 kB |
| Dynamic | `/address/[address]/verified-build` | 520 kB | 820 kB |
| Dynamic | `/address/[address]/vote-history` | 510 kB | 820 kB |
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
| Dynamic | `/block/[slot]` | 260 kB | 570 kB |
| Dynamic | `/block/[slot]/accounts` | 250 kB | 550 kB |
| Dynamic | `/block/[slot]/programs` | 250 kB | 550 kB |
| Dynamic | `/block/[slot]/rewards` | 250 kB | 560 kB |
| Dynamic | `/epoch/[epoch]` | 20 kB | 330 kB |
| Static | `/feature-gates` | 50 kB | 350 kB |
| Dynamic | `/mcp` | — | — |
| Static | `/mcp/start` | 30 kB | 340 kB |
| Dynamic | `/og/account/[address]` | — | — |
| Dynamic | `/og/feature-gate/[address]` | — | — |
| Dynamic | `/og/receipt/[signature]` | — | — |
| Dynamic | `/og/tx/[signature]` | — | — |
| Static | `/opengraph-image.png` | — | — |
| Dynamic | `/robots.txt` | — | — |
| Static | `/tos` | 10 kB | 320 kB |
| Dynamic | `/tx/[signature]` | 560 kB | 870 kB |
| Dynamic | `/tx/[signature]/inspect` | 560 kB | 870 kB |
| Static | `/tx/inspector` | 560 kB | 870 kB |