# Proposal: Unify instruction parsing across the tx page and inspector

## Context

- The `/tx/[signature]` page renders RPC-pre-parsed `ParsedInstruction` objects through per-program `*DetailsCard` components. The inspector (`/tx/(inspector)/inspector`) decodes a raw `VersionedMessage` locally and renders through a **parallel** pipeline rooted at its own `InstructionsSection`.
- The inspector's adapter (`app/components/inspector/into-parsed-data.ts`) covered only System, Associated Token, Token, Token-2022, and MPL Token Metadata — every other program (Stake, Vote, BPF, Memo, ALT, Compute Budget, Lighthouse, SAS, Anchor/Program Metadata IDL, …) fell back to `UnknownDetailsCard`.
- That adapter also mutated its input (`instruction.data`), shadowed `PROGRAM_INFO_BY_ID` with its own 4-entry registry, returned `any`, and routed `CreateAccountWithSeed` through a separate asymmetric path. Even when it produced a `ParsedInstruction`-shaped object, the inspector still rendered through its own card switch rather than the tx page's `InstructionCard`.

## Why

Every new program or `*DetailsCard` improvement had to land on **both** surfaces or the inspector silently fell behind — and it already had. With no shared contract test, the two pipelines drift apart and the same instruction renders differently depending on which page the user opened.

The goal: **one parser per program, one canonical shape, one place to add a program.** The inspector becomes a thin wrapper that feeds raw `TransactionInstruction`s through the same parsers the tx page already trusts via RPC pre-parsing. A contract test pins both paths to the same shape so they cannot disagree.

### Alternatives considered

- **Inspector mimics RPC's `ParsedInstruction` shape (original draft).** Rejected as asymmetric — it privileges the RPC shape and bakes web3.js's `parsed.info` structure into every slice. Chosen instead: each slice owns a canonical, typed `SliceParsed` (usually a discriminated union); **both** surfaces converge on it. RPC is not "the default"; the slice is.
- **Per-route dispatchers wired into each page.** Rejected in favor of a single shared dispatcher (`app/tx/instruction-parser-dispatcher.ts`) delivered once via `InstructionParserProvider` in `app/tx/layout.tsx`, the common ancestor of all `/tx` routes. Adding a program touches one list; every route inherits it.
- **Module-level global registry / a top-level `instruction-parsers/` barrel.** Rejected — the barrel violated FSD slice isolation and a global registry holds hidden state. Chosen instead: a pure `createInstructionParserDispatcher(parsers)` factory delivered through React Context.
- **Migrate all `*DetailsCard` components to consume `SliceParsed` now.** Deferred to a future change. A transitional compat wrap (`toParsedInstruction`) keeps the ~15-20 cards and their superstruct validators unchanged so this change stays additive; collapsing the render pipeline and deleting the wrap is out of scope here.
- **One Token slice covering Token + Token-2022.** Rejected — distinct `programId`s, distinct `@solana-program/*` packages, different instruction supersets. One slice per `programId`.

## What Changes

This change builds the shared foundation and migrates the five programs the inspector already parsed. It is intentionally additive — no card or validator changes, no behaviour change.

- Add the **`instruction-parser` entity** (`app/entities/instruction-parser/`): the `InstructionParser<P>` / `ParsedInstructionInfo` / `InstructionParserDispatcher` contract, the `createInstructionParserDispatcher` factory (throws on duplicate `programId`, holds no module state), the `InstructionParserProvider` / `useInstructionParser` Context delivery (hook throws outside a provider), and the transitional compat layer (`toParsedInstruction`, `toParsedTransaction`).
- Add **per-program feature slices** under `app/features/decode-instruction-*/`: `decode-instruction-system`, `decode-instruction-token`, `decode-instruction-token-2022`, `decode-instruction-associated-token`, and the existing `mpl-token-metadata` feature. Each publishes `fromTransaction` (raw kit bytes → `SliceParsed`) and, when the RPC pre-parses that program, `fromParsed`. Slice internals use `@solana/kit` and the `KitInstruction` bridge — no `@solana/web3.js` types.
  - **Naming.** The `decode-instruction-<program>` prefix is deliberate (per review): bare `instruction-<program>` is a weak namespace once 15+ programs land — it collides conceptually with the `instruction-parser` entity and the `app/components/instruction/` cards, and reads as "the program's instruction feature" rather than "the decoder for it." Since these slices operate on raw buffer data, `decode` is the honest verb. `mpl-token-metadata` keeps its name: it is a broader feature (it owns a `*DetailsCard` UI), not a pure decoder slice. The `instruction-parser` entity and the `InstructionParser` contract keep their names — the proliferation concern is about features, and the entity describes the parsing *contract*, of which decoding is one half.
- **Wire both surfaces through one shared dispatcher** at `app/tx/instruction-parser-dispatcher.ts`, provided once in `app/tx/layout.tsx`. The tx page normalises RPC input via `dispatcher.fromParsedInstruction(ix)` (pass-through for unsliced programs); the inspector decodes via `dispatcher.fromTransactionInstruction(ix)`.
- **Delete `app/components/inspector/into-parsed-data.ts`** and its ad-hoc parsers/registry.
- Add a **cross-pipeline contract test** asserting the byte-parsed and RPC-parsed paths produce equivalent, validator-satisfying `parsed.info` for the same logical instruction; it must extend by one assertion per new slice.
- The capability spec ships as a delta at `specs/instruction-parser/spec.md` within this change (optional artifact, included because the contract is non-trivial).

**Out of scope** (deliberately not in this change, tracked for follow-ups): inspector coverage for programs the old adapter never handled (Stake, Vote, ALT, BPF, Memo, Compute Budget, Lighthouse, SAS, Anchor/Program Metadata IDL, …); collapsing the two per-surface card switches into one render pipeline; deleting the compat wrap by migrating cards to consume `SliceParsed` directly.

### Follow-up areas raised in review

These are explicitly *not* solved in Phase 1, but the unification has to have an answer for each before it is "done." Captured here so they are not forgotten:

- **Inner instructions.** The tx page renders `inner_instructions` (CPI children); the inspector today decodes outer instructions only. The dispatcher contract is per-instruction, so it already works for inner instructions in principle — a later change extends the inspector's `InstructionsSection` to walk the inner set and dispatch each child through the same path, so CPI children get slice-parsed cards on both surfaces.
- **Anchor and Squads.** Explorer renders Anchor (IDL-driven) and Squads instructions through their own card paths. These are not byte-discriminated the way the native programs are — Anchor needs an IDL, Squads wraps inner instructions. They will become slices that resolve their decoder dynamically (IDL fetch / nested dispatch) rather than from a static discriminator table; the dispatcher contract does not change, but `fromTransaction` for these slices is async/context-dependent. A dedicated follow-up scopes how a slice declares "I need an IDL" before this lands.
- **Transaction variants and message source.** The inspector can be fed two ways — load a transaction by signature, or accept a versioned message in wire format — and the message itself may be a `LegacyMessage` or a `VersionedMessage`. Phase 1 normalises at the instruction level (`TransactionInstruction` → `KitInstruction`), so it is agnostic to how the message was obtained. We are not migrating message decoding to `@solana/kit` wholesale in this change; legacy and versioned messages both reduce to the same per-instruction input. The dispatcher now exposes a `canHandle(programId)` predicate (a cheap, parse-free registration check) so a caller can decide whether to route through a slice before attempting a decode — useful for the Anchor/Squads phase, where a slice may want to short-circuit before an expensive IDL fetch. It is intentionally a *registration* check, not a per-slice re-implementation of the discriminator logic, so it cannot drift from what the parsers actually accept; per-slice "can I handle this exact instruction" remains expressed by `fromTransaction`/`fromParsed` returning `undefined`.

## Impact

- **No user-facing behaviour change.** Cards and superstruct validators are untouched; the compat wrap preserves the existing prop interface. Parity between tx page and inspector is verified by the contract test and manual checks.
- **Adding a program** is now one slice plus one line in the shared dispatcher list; every `/tx` route picks it up through the layout provider.
- **Accepted transitional debt.** `toParsedInstruction` / `toParsedTransaction` are the *only* permitted shims and live in one file (`model/compat.ts`); double validation occurs while tx-page input flows through both `slice.fromParsed` and the card's `create(...)`. A future change that migrates cards to consume `SliceParsed` directly deletes the wrap and the second pass in one go.
- **Latent bugs fixed** during migration (previously hidden by `any`): wrong account keys on `Allocate`/`AllocateWithSeed` and Token-2022 pointer parsers, and unwrapped `Option<...>` fields on `EmitTokenMetadata` / `Initialize*Pointer`.
- **Known follow-ups:** this change is net-positive on its own (drift is mechanically prevented and both surfaces use slice-owned shapes internally), but the "one render pipeline, one prop interface" goal needs a later change that collapses the per-surface card switches and removes the compat wrap. Token-2022 `Initialize*Pointer` validators still expect non-nullable PublicKeys where the program allows `None` (pre-existing; parser passes `undefined`). Inspector currently decodes outer instructions only.
- **Conventions established:** `undefined` over `null` in new code; hyphenated filenames (`system-parser.ts`); `@solana/kit` + `@/app/shared/lib/web3js-compat` as the single web3.js bridge; FSD `model/` segment for entity domain logic + React bindings.
