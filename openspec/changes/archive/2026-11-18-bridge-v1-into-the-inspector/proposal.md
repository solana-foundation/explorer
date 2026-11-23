# Proposal: Bridge v1 transactions into the inspector

## Context

`read-v1-transactions-with-kit` made v1 transactions render on the detail page but gated the inspector: `PermalinkView` shows "does not yet support v1" because the inspector's spine is web3.js `VersionedMessage`, which tops out at v0. `adopt-kit-7-transaction-introspection` recorded un-gating as deferred and "larger than it appears" — six components and three entry paths all consume `VersionedMessage`, and the simulator serializes it.

## Why

The deferred assessment assumed un-gating means re-rooting the inspector on kit's `CompiledTransactionMessage`. Two facts, both verified against kit 7.0.0's types, make a far smaller change sufficient:

1. **A v1 message carries static accounts only.** `V1CompiledTransactionMessage` has no `addressTableLookups` field at all. Every structural fact the inspector renders — header role math, static keys, compiled instructions — therefore maps losslessly onto web3.js's `MessageV0` shape, with empty lookups and the lifetime token as the blockhash. Lookup hydration, the hardest part of the re-root, has no v1 case to handle.

2. **The serialize hazard is two overrides, message and envelope.** The prior change rejected synthesizing a `MessageV0` because `message.serialize()` would emit v0 bytes that are not the real transaction — the simulator would simulate bytes the network never sees, and cache fingerprints would hash them. A `MessageV0` subclass whose `serialize()` returns the original v1 wire bytes closes the message half. The envelope needs its own override: v1 reorders the wire envelope to message-first with no signature-count prefix (the count is read from the message header), so web3.js's signatures-first `VersionedTransaction.serialize()` wraps even correct message bytes in an envelope a v1-aware node rejects as an invalid message version. The simulator therefore sends a `VersionedTransaction` subclass that encodes the envelope through kit's transaction encoder, pinned by a spec asserting byte-equality with kit's own encoding of the same unsigned transaction.

The alternative — re-rooting the spine on kit's compiled message — remains the destination the kit migration will reach, but it renames header math, rebuilds lookup ordering, and changes the decode path for legacy and v0, all regression surface this change's goal ("v1 works, legacy/v0 untouched") does not need. The bridge is deliberately a shim: it is deleted, not extended, when the re-root lands.

### Decisions

**The bridged view's `version` getter still reports 0.** `MessageV0` types the getter as `get version(): 0`; widening it breaks `VersionedMessage` narrowing everywhere. The true version rides on `TransactionData.version`, and the overview card renders an explicit version row for v1, so nothing user-facing reads the lying getter.

**The address table lookups card is hidden for v1** rather than rendering an empty v0-style table, because v1 has no lookup support to report on.

**v1 is sniffed by its wire prefix byte (`0x81`).** Legacy messages never set the version flag bit and v0's prefix is `0x80`, so the single byte is unambiguous — and bytes carrying it fail `VersionedMessage.deserialize` today, so the sniff diverts only inputs that currently error.

## What Changes

- **New `app/shared/lib/v1-message-bridge.ts`** — `isV1MessageBytes`, `V1MessageView` (the serialize-truthful `MessageV0` subclass), `UnsignedV1WireTransaction` (the message-first envelope for simulation), and `bridgeV1MessageBytes`, which decodes with kit and reads the resource-limit config off `decompileTransactionMessage`.
- **All three entry paths un-gate:** the permalink view bridges the v1 arm of `RawTransaction`, and the `?message=` URL and paste paths bridge before falling through to `VersionedMessage.deserialize` for legacy/v0.
- **The overview card renders v1's version and resource limits** (compute unit limit, total priority fee, loaded accounts data size limit, heap size), mirroring the detail page's summary card.
- **The simulator sends the v1 envelope for v1 messages** and the overview size row uses v1's envelope math and 4096-byte limit; the Squads path and every other inspector card are untouched.

## Impact

- **No behaviour change for legacy/v0**: the bridge sits behind a prefix-byte check that only matches bytes which previously failed to decode.
- Simulation, signature verification, the size row, the download button, and permalink round-trips all operate on the true v1 wire bytes.
- Whether a cluster's RPC accepts a v1 `simulateTransaction` depends on its runtime support; a rejection surfaces through the simulator's existing error card.
- **Deferred, unchanged:** re-rooting the inspector spine on kit's `CompiledTransactionMessage`, which deletes this bridge.
