# Extract the transaction version seam into `@explorer/parsers/transaction`

## Context

Transaction v1 (SIMD-0385 format, SIMD-0296 size) is live on mainnet. It differs from legacy and v0 in four ways:

- resource limits move out of Compute Budget instructions and into message config
- the priority fee is a total in lamports, not a price per compute unit
- address lookup tables are gone
- the size limit rises to 4096 bytes, and the envelope drops its signature-count byte

There is no single place which holds the rules that differ between transaction versions, so some parts of the
app either work them out on their own or do not support v1 transactions.

## Why

Solana has three transaction versions, and each one has different rules for size, compute budget and fees.
The proposed package works with a transaction of any version, provides one shape and applies those rules in
one place, so the rest of the app can use it.
Support for another possible version is then added once to the package, instead of in every screen that shows
a transaction.

Alternatives considered:

- **Fix each consumer in place.** This is the state we are in, and it is what produced the scatter. Rejected.
- **Export version facts only, with no shared transaction type.** Rejected. It removes duplicated branches,
  but every consumer still holds a different object.
- **A factory that returns one Tx class per version, with methods such as `tx.sizeLimit()`.** Rejected. Most
  size and config callers hold bytes or a compiled message, not a transaction, so the free functions must exist
  anyway. The cluster and epoch exist only at render time, so a method that
  needs them takes the same arguments as the free function. A bundler cannot drop unused methods, so a page
  that only checks size would also load the compute unit code.
- **Use kit's transaction helpers directly.** Rejected for the parts kit does not cover. Its account metas
  carry no `source` or lookup table, its config value codec is internal, `getTransactionSizeLimit` needs a kit
  `Transaction` that the union never holds, and each of its priority fee helpers covers only some versions.
  The package still calls kit for instruction normalisation and the config mask predicates.

## What Changes

In delivery order. Step 2 needs only step 1.

1. **Create both packages.** `@explorer/parsers/transaction`, `@explorer/parsers/programs/compute-budget`.
2. **Switch MCP.** `entity-inspector` parses through `fromRpcTransaction`, drops its account resolver and
   accepts v1.
3. **Switch block pages.** `BlockTransaction` carries a `ParsedTransaction`.
4. **Switch compute units.** The app estimators and default table are deleted.
5. **Switch SummaryCard and fees.** `transaction-fee` re-exports the package fee.
6. **Switch the inspector.** The web3.js bridge loses its unused exports.

## Impact

- `packages/parsers` gains two subpaths. The package gates (agadoo, node-esm, coverage) apply unchanged.
- Legacy and v0 MCP payloads must stay byte-identical, proven by snapshots taken before the switch.
- Accepted risk: the package declares RPC response shapes, so an RPC output change becomes a package change.
- Accepted risk: the compute unit feature gate table now updates through a package build, not an app edit.
- Unverified: `get-transactions-for-address.ts` omits the version ceiling, because
  `transactionDetails: 'signatures'` returns no message. One run of Triton's method against an address with v1
  activity confirms that v1 signatures come back.
