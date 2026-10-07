# Design: `@explorer/parsers/transaction`

The package provides one set of functions that work on any transaction, legacy, v0 or v1. It keeps the version
differences inside. Callers pass a transaction and get the result, without needing to know tx version.

## The ParsedTransaction and versions union

Knows what an RPC returns, declared structurally. Makes no RPC calls, carries no web3.js or cluster config.

```ts
type TransactionBase = {
    accounts: readonly TransactionAccount[];
    instructions: readonly TransactionInstruction[];
    numSignerAccounts: number;
    lifetimeSpecifier: string;
    signatures: readonly (string | undefined)[];
};

export type ParsedTransaction =
    | (TransactionBase & { version: 'legacy' })
    | (TransactionBase & {
          version: 0;
          addressTableLookups?: readonly AddressTableLookup[];
          unmatchedLookupTableAddresses?: readonly Address[];
          unmatchedLookupTableIndexes?: readonly AddressTableLookup[];
      })
    | (TransactionBase & { version: 1; config?: TransactionConfig });
```

- Accounts and instructions sit in the base.
- `addressTableLookups` and both `unmatchedLookupTable*` fields sit on the v0 arm alone.
- v1 removed lookup tables and legacy tx never had them.
- `addressTableLookups` is optional: `undefined` means the response did not report the tables, `[]` means
  there are none.
- `unmatchedLookupTableAddresses` lists loaded addresses missing from every listed lookup table. Absent when
  the encoding omits them.
- `unmatchedLookupTableIndexes` lists lookup table indexes that no loaded address fills. Absent when the
  encoding omits the tables. The two fields are the two sides of one positional match.
- `config` sits on the v1 and is optional, because a tx may set no limits at all.
- `TransactionConfig` repeats kit's `V1TransactionConfig` field for field, under a name the union can use on
  any version. kit does export that type, so the comment in `v1-message-bridge.ts` saying otherwise is stale.

The union does not carry `meta`. Balances, inner instructions, consumed compute units and the fee are
execution results.

## Constructing ParsedTransaction from rpc/message/bytes

This codebase has two inputs: a decoded message, and an RPC response. Both produce the same value and neither
takes a version.

- `fromCompiledMessage` takes a decoded message. The version comes off the message.
- `fromMessageBytes` decodes, then delegates. It rejects trailing bytes, so a wire transaction cannot pass as a
  message.
- `fromRpcTransaction` is one entry point for every encoding. It detects which encoding arrived the way kit's
  `decodeTransactionFromRpcResponse` does. `base64` and `base58` carry the full wire transaction, whose
  `messageBytes` and signatures go to `fromCompiledMessage`. `json` carries the compiled header. `jsonParsed`
  carries neither, and sends accounts with their roles already resolved.

`RpcTransactionResponse` and the three encoding shapes are declared structurally, not derived from kit's
overloaded `GetTransactionApi`. `fromRpcTransaction` throws `UnsupportedTransactionVersionError` on an unknown
version, whether the response reports it or the wire bytes encode it.

- `json` and `jsonParsed` also throw on a `null` or missing version, because the message cannot say what it is.
- `base64` and `base58` carry the version in the bytes. A missing version defers to the bytes, and a reported
  one must match them.

`lookupTableAddress` is optional because only `json` and `base64` name the table an address came from, while
`jsonParsed` reports that it came from one but not which.

### What happens to the MCP normalizer

`normalizeTransactionProbe` does two jobs. Only the first one moves.

| Job | Where it goes |
| --- | --- |
| Static keys, header checks, version normalisation, account resolution, instruction index checks, blockhash | `fromRpcTransaction` |
| Slot, block time, fee, consumed CUs, log messages, confirmation status, error shape, status arm | stays in the normalizer |

The second half is payload work: signature statuses, `SafeNumeric` coercion, the status arm. None of it
differs by version, so it stays and runs on the result of `fromRpcTransaction`.

The package resolves accounts with one internal `resolveAccounts(params)` that branches on `version`. Its
helper `resolveStaticAccounts(staticKeys, header)` classifies the static keys.

## Usage

| Consumer | Encoding | File | Entry point |
| --- | --- | --- | --- |
| MCP | `json` | `packages/entity-inspector/src/transactions/normalizer.ts` | `fromRpcTransaction` |
| Transaction detail page | `jsonParsed` | `app/entities/transaction-data/lib/adapt-parsed-transaction.ts` | `fromRpcTransaction` |
| Block page | `base64` | `app/entities/block-data/api/fetch-block.ts` | `fromRpcTransaction` |
| Inspector | pasted message bytes | `app/components/inspector/` | `fromMessageBytes` |

- **MCP.** `build-payload.ts` still maps the result into the wire shapes (`program_id`, base58 `data`,
  `inner_instructions`) that the byte-identical rule pins.
- **Transaction detail page.** This is where the config kit already types on the response stops being thrown
  away.
- **Inspector.** The one caller that starts from bytes rather than a response. A v0 message that loads accounts
  from lookup tables needs them resolved first. The inspector reads the table addresses from the decoded
  message, fetches the tables, then passes `loadedAddresses`. Without `loadedAddresses`, parsing throws.

## Reading the TransactionConfig

Kit exports the mask predicates but not the value codec, hence the package owns this decoding, in
[`config.ts`](../../../packages/parsers/src/transaction/config.ts).

- Mask bit order is the value order on the wire.
- `readTransactionConfig` does not call kit's `decompileTransactionMessage`, which throws on an out-of-range
  account index and costs a full message decompile per call.

The RPC sends the same four limits under different names, and marks them nullable rather than optional. One
adapter, `fromRpcTransactionConfig`, covers that.

## Compute budget

The compute unit reserve schedule is chain knowledge. It is a table of feature gate activation epochs per
cluster, plus per-program reserves quoted from Agave. It moves from `app/entities/compute-unit/lib/` to
[`@explorer/parsers/programs/compute-budget`](../../../packages/parsers/src/programs/compute-budget/index.ts).

`getRequestedComputeUnits` replaces both estimators and `extractComputeUnitsFromInstruction`. Each caller switches once its entity carries a `ParsedTransaction`, then the estimators are deleted.

`source` keeps the requested CU number origins:

- v1 with `config.computeUnitLimit` - `declared`.
- legacy/v0 with `SetComputeUnitLimit` ix - `declared`.
- v1 with no config - `fallback` (to 0).
- legacy/v0 with no limit instruction - `calculated`.

Two signature changes come with this:
The web3.js `PublicKey` and `ComputeBudgetProgram` parameters become a kit `Address`.
The app's `Cluster` enum from `@utils/cluster` becomes `ScheduleCluster`, mapped once at the app boundary.

### Priority fee

`resolvePriorityFeeLamports` returns the total a v1 message declares, or derives it from the RPC fee for legacy and v0. Lamport amounts are `bigint`.

## Decisions

- **`app/shared/lib/v1-message-bridge.ts` stays in the app.** Its version-neutral parts move out:
  `isV1MessageBytes`, the size constants, the config reader. What remains is `V1MessageView`,
  `UnsignedV1WireTransaction` and a `toWireTransactionBytes` helper. All three are web3.js-typed, have one
  consumer (the app, never MCP), and have a deletion date once the inspector is kit-native. Moving code that
  is about to be deleted buys a coverage gate and costs a migration. Revisit if the inspector rebuild slips.
  `@explorer/parsers` already depends on web3.js for its `./compat` subpath, so the shim would land there,
  never in `./transaction`.
