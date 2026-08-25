# Proposal: Read v1 blocks with kit

## Why

Block pages pin `maxSupportedTransactionVersion: 0`. `getBlock` has no partial mode, so one v1 transaction fails the whole block. Pinning to `1` fails at runtime on web3.js 1.98.4, whose schema admits only `0`/`legacy` and cannot hold `transactionConfig`. kit is the migration direction, so blocks follow the transaction and inspector paths.

Two non-obvious choices:

- **`base64` over `json`** — kit's RPC types don't model `transactionConfig`, so the wire bytes are its only source, and they reuse `bridgeV1MessageBytes`.
- **The estimator gates on `version === 1`, not on a config existing** — an absent v1 config means zero, not a default.

## What Changes

New `app/entities/block-data`, fetched from `app/providers/block.tsx`. `estimateRequestedComputeUnits` reads v1's limit from the message config. The four block cards retype their `block` prop; no logic changes.

## Impact

Legacy/v0 unchanged. Still pinned at `0`: receipt, transaction history, PMP discovery, interactive IDL, `entity-inspector` default. Deferred: moving the cards off web3.js types, which deletes this adapter.
