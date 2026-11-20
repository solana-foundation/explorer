# Proposal: Read transaction details with kit so v1 renders

## Context

Agave 4.2 accepts version 1 transactions (SIMD-0385), so they land on chain today. v1 differs from v0 in ways the Explorer's rendering path had no answer for:

- Resource limits — compute unit limit, heap size, loaded accounts data size limit, priority fee — move out of Compute Budget instructions and into a message-level config. The priority fee becomes a **total in lamports**, not a per-compute-unit price in micro-lamports.
- The wire envelope reorders: message bytes first, then a fixed-count signature array with no length prefix.
- There is no address lookup table support.

Before this change the transaction detail page fetched through web3.js `Connection` with `maxSupportedTransactionVersion: 0`, so a v1 transaction did not render at all.

Raising that ceiling to `1` does not work. web3.js 1.98.4 validates the RPC response with `TransactionVersionStruct = union([literal(0), literal('legacy')])` (`node_modules/@solana/web3.js/lib/index.cjs.js:5596`), and that struct backs `GetTransactionRpcResult`, `GetParsedTransactionRpcResult` and `GetBlockRpcResult` alike. Ask for v1 and superstruct **throws** on the first v1 transaction the RPC returns — a strictly worse failure than the one we started with. web3.js cannot represent a v1 message either: `VersionedMessage.deserialize` asserts `version === 0`.

The `solana` CLI cannot inspect v1 today — `solana confirm -v` sends no `maxSupportedTransactionVersion` and has no flag for it — which makes Explorer the primary inspection tool for v1 until the CLI catches up.

## Why

Reading v1 requires a client that understands it, and `@solana/kit` (already a dependency at 6.5.0) does: it decodes v1 wire bytes, exposes the config mask, and `decompileTransactionMessage` yields the typed limits. AGENTS.md already prefers kit for new functionality.

The open question was not *whether* to use kit but **how far to propagate it**. Roughly twenty components downstream of the transaction providers are written against web3.js types (`ParsedTransactionWithMeta`, `PublicKey`, `VersionedMessage`).

Alternatives considered:

- **Migrate the detail page's consumers to kit types.** Rejected for this change: a large diff across components that have nothing to do with v1, and every one of them a regression risk for legacy and v0 rendering, which is the overwhelming majority of traffic. It remains the right long-term direction.
- **Adapt kit's response into the web3.js shape at the provider boundary — picked.** One adapter, ~150 lines, fully covered by unit tests. Consumers keep compiling. The only type that had to widen is the transaction version, which web3.js caps at v0.
- **Keep web3.js and hand-roll a v1 decoder.** Rejected: re-implements what kit already ships and tests.
- **Upgrade kit to 7.x for `decodeTransactionFromRpcResponse`.** Rejected as unnecessary: 6.5.0's `getCompiledTransactionMessageDecoder` + `decompileTransactionMessage` do the same job, and a major bump is its own risk with its own change.

A second decision: **where the v1 config comes from.** The RPC serves it under `message.transactionConfig`, but kit's RPC types do not model that field (not in 6.5.0, not in 7.0.0), so reading it there would mean a hand-written validator against an untyped field. Decoding the base64 wire bytes instead goes through kit's typed decoder and needs no validator of our own — and those bytes are already fetched for the download action and the inspector, so the config rides along on that response rather than costing a request of its own.

A third: **the Inspect page is gated, not adapted.** Its cards are built on `VersionedMessage`/`MessageV0` throughout. Synthesizing a `MessageV0` from a v1 message would make them render, but `serialize()` would then emit v0 bytes — so the Download button would hand the user a transaction that is not the one on chain. An explicit "not yet supported" card is honest; wrong bytes are not.

## What Changes

- **New entity layer** under `app/entities/transaction-data/`: kit-backed `fetchTransactionDetails` and `fetchRawTransaction`, an `adaptParsedTransaction` boundary, and `decodeWireTransaction` / `decodeTransactionConfig` for the v1 limits. Both fetchers request kit's own `MAX_SUPPORTED_TRANSACTION_VERSION` ceiling.
- **Providers** `app/providers/transactions/{parsed,raw}.tsx` drop `Connection` for those fetchers. `Details.raw` gains `messageBytes` (the exact wire bytes), `version` and the decoded v1 `transactionConfig`; it is a union on `version`, so `message` and `transaction` are present for legacy and v0 and absent on v1.
- **Download** reads `messageBytes` rather than re-serializing a parsed message, so it is byte-exact on every version.
- **Summary card** renders the v1 limits, labels the priority fee `Priority fee (total)` to distinguish it from v0's per-compute-unit price, sources the compute unit limit from the config on v1 (the Compute Budget scan it used before finds nothing there), and shows versions as `legacy` / `v0` / `v1`.
- **Version type widened** in `TransactionWithMeta` to kit's `TransactionVersion` (`'legacy' | 0 | 1`); web3.js's own version type caps at v0. Functions that never read the version — the receipt model, CU profiling, `collectTransferInstructions` — widen to match; web3.js's narrower type stays assignable, so the server-side receipt path is unaffected.

## Impact

- **Behaviour change on existing transactions:** the version row now reads `v0` where it previously read `0`. Deliberate, so `v1` does not sit next to a bare `0`.
- **Out of scope, still on `maxSupportedTransactionVersion: 0`:** the block page (`app/providers/block.tsx`), address history (`app/features/transaction-history/`), and the server-side receipt fetch (`app/features/receipt/api/get-tx.ts`). They omit v1 entries rather than erroring; each needs the same web3.js→kit move and is worth its own change.
- **No extra requests:** the detail page issues the same two calls it did before — one parsed, one raw — on every version.
- **Nodes that predate v1** compare the requested ceiling against the versions they actually hold, so sending `1` to them is inert. Submitting v1 wire bytes to an Agave 3.x node is a different path (`app/features/idl/interactive-idl/`) and is untouched here.
