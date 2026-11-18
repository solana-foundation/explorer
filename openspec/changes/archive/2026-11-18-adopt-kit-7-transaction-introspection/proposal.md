# Proposal: Decode transactions with kit 7's transaction introspection

## Context

`read-v1-transactions-with-kit` landed v1 support on kit 6.5.0 by hand-rolling two decoders — `decodeWireTransaction` for the reordered v1 wire envelope and `decodeTransactionConfig` for the message-level resource limits. It explicitly deferred the kit 7 upgrade as "unnecessary, and a major bump is its own risk with its own change." This is that change.

kit 7 ships `@solana/transaction-introspection`, which does both jobs natively and is re-exported from `@solana/kit` — so adopting it adds no dependency.

### What the upgrade actually costs

The upgrade was surveyed by installing 6.5.0 and 7.0.0 side by side and diffing their export surfaces, rather than by reading release notes:

- kit 7 removes exactly two runtime exports: `createEmptyClient` and `getMinimumBalanceForRentExemption`. Neither is referenced in `app/` or `packages/`. All 157 kit imports this repo uses survive the major.
- The app typechecks against kit 7 with **zero** errors, and the five workspace packages build unchanged. The "~592 files import kit" figure is import breadth, not breakage.
- The real cost sits in the dependency graph, not our code. Every `@solana-program/*` client peer-depends on kit `^6` until its 2026-07-15 release, so they move with the bump. `@solana/subscriptions` is the only genuine break: every release before 0.5.0 imports the removed `getMinimumBalanceForRentExemption` and throws at import time. It typechecks clean and fails only at runtime, which is why the two subscriptions test suites — not the compiler — caught it.

## Why

The hand-rolled decoders re-implement what kit now ships and tests. `decodeTransactionFromRpcResponse` also takes a `getTransaction` response directly rather than requiring the caller to pull the base64 field out and convert it, so the call sites lose a step as well as a file.

### Decisions

**`@solana/transaction-introspection` is not added as a dependency.** kit's index does `export * from '@solana/transaction-introspection'`, so `decodeTransactionFromRpcResponse`, `walkInstructions`, `getInstructionsFromCompiledTransactionMessage` and `getAccountMetasFromCompiledTransactionMessage` all import from `@solana/kit`. A direct dependency would be a second copy to keep in version lockstep for no gain.

**`TransactionConfig` is derived from kit's message type, not imported by name.** kit 7 models the config as `V1TransactionConfig`, but `@solana/transaction-messages` does not re-export `./v1-transaction-config` from its index — the type and its `isV1ConfigEmpty` helper are internal. The prior change's observation that "kit does not re-export it as a type" still holds in 7.0.0. Rather than keep hand-declaring the four fields, `TransactionConfig` reads the config off the v1 arm of kit's exported `TransactionMessage`, so it tracks kit's definition without depending on an unexported name.

**`@solana/subscriptions` is carved out of `minimumReleaseAge`.** The workspace requires dependencies to be 14 days old; 0.5.0 is the only kit-7-compatible release and does not age in until ~2026-08-24. The carve-out is scoped to that one first-party `@solana` package and is commented for removal once 0.5.0 clears the gate. The alternative — dropping the age gate workspace-wide — would remove a supply-chain control from every dependency to solve a two-week timing problem.

**The detail page stays on `jsonParsed`, and `adaptParsedTransaction` stays with it.** `decodeTransactionFromRpcResponse` throws on `jsonParsed` by design: those instructions arrive pre-parsed by the server with no raw bytes, so they cannot round-trip through the generated `parseXInstruction` clients. Moving the detail page to `base64` therefore means every instruction renderer re-parses locally — and 122 files in `app/` and `packages/` consume web3.js `ParsedInstruction` / `ParsedTransactionWithMeta` shapes. That work *is* `unify-instruction-parsing`, whose stated goal is exactly this convergence; duplicating it here would mean two large changes racing on the same files. The adapter is retained deliberately, not by omission.

## What Changes

- **kit 6.5.0 → 7.0.0** in the root and all five workspace packages, with the `@solana-program/*` clients moved to their kit-7 releases and `@solana/subscriptions` to 0.5.0.
- **`decodeWireTransaction` deleted.** `fetchRawTransaction` calls `decodeTransactionFromRpcResponse` on the response and keeps only the signature-map-to-base58 rendering, which is presentation rather than decoding.
- **`decodeTransactionConfig` and its spec deleted.** `fetchRawTransaction` reads the config off `decompileTransactionMessage(compiledMessage).config`, and the combinations the deleted spec covered move to its own spec.
- **`TransactionConfig` derived from kit's `TransactionMessage`** rather than hand-declared.

## Impact

- **No behaviour change.** The specs pin the same rendering; the full suite shows the same 46 pre-existing failures across the same 7 files before and after the bump, with the 6 tests of the deleted config spec the only difference in the totals.
- **Deferred to `unify-instruction-parsing`:** the detail page's `jsonParsed` → `base64` move and the removal of `adaptParsedTransaction`.
- **Deferred, and larger than it appears:** moving the inspector's `InstructionsSection` to `walkInstructions` and un-gating v1 there. The gate sits upstream of that component. `VersionedMessage` is the inspector's spine — `OverviewCard`, `SimulatorCard`, `TransactionSignatures`, `AccountsCard`, `AddressTableLookupsCard` and `InstructionsSection` all consume it, and three entry paths (permalink fetch, pasted raw message, Squads proposal) all produce one. Un-gating v1 means re-rooting all of them on kit's `CompiledTransactionMessage`, including replacing `message.serialize()` in the simulator — which is precisely the hazard the prior change identified when it chose to gate rather than synthesise a `MessageV0`. Swapping the instruction list alone does not un-gate anything.
- **Follow-up:** remove the `minimumReleaseAgeExclude` entry for `@solana/subscriptions` after 2026-08-24.
