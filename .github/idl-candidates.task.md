# Fix the review findings on PR #1416

## Context

A review of [PR #1416](https://github.com/solana-foundation/explorer/pull/1416) at commit `d01e92275f426bb50709d678abf5856b4344e793` found these open problems. Each item names a symbol, not a line.

## Behavior

Both items have one cause: the Anchor callers choose an IDL by its standard tag, then need that IDL to build a whole `Program`. One change can fix both.

- [ ] Try the next Anchor candidate when the first one does not build a `Program`. `getFirstAnchorIdl` and `getFirstAnchorIdlWithAccounts` in [idl-candidates.ts](../app/entities/idl/model/idl-candidates.ts) return the first Anchor-tagged IDL. A PMP IDL that does not build therefore hides a working Anchor IDL account in log rows, `AnchorProgramName`, `AccountDataTab` and `AnchorAccountCard`. The base built all four from the Anchor IDL account. `new Program` throws `Account not found: pool` on a spec `0.1.0` IDL that lists an account with no matching type. A hook that takes the ordered Anchor candidates and returns the first `Program` that builds fixes all four callers.
- [ ] Decide the Anchor Data tab and the account decode on `BorshAccountsCoder`, not on `Program`. [AnchorAccountCard.tsx](../app/components/account/AnchorAccountCard.tsx) and [AccountDataTab.tsx](../app/address/[address]/AccountDataTab.tsx) call `useAnchorProgram`, so both need the whole IDL to build. A PMP-only Anchor IDL with complete account types and one missing instruction type loses the tab, and the card shows `No Anchor IDL found`. The base decoded that IDL with `new BorshAccountsCoder(pmpIdl)`. With the devi 0.30.1 fixture plus one instruction argument of type `{ defined: { name: 'ExternalType' } }`, `new Program` throws `Type not found: ext` and `new BorshAccountsCoder` builds all eight account layouts. The `AccountDataTab.spec.tsx` case "should hide the tab when the Anchor-standard candidate with account types does not build a program" states the opposite rule, so change that case with the fix. Keep the `Program` for the card title.

## Tests

- [ ] Test that Squads and verified builds read only the Anchor IDL account. `ProgramMultisigCardInner` in [ProgramMultisigCard.tsx](../app/components/account/ProgramMultisigCard.tsx) and `useEnrichedOsecInfo` in [verified-builds.tsx](../app/utils/verified-builds.tsx) call `getOnChainAnchorIdl(onChain)`. No spec renders either one, and `upgradeable-program-page-clients.spec.tsx` mocks `ProgramMultisigCard` whole. For each caller, mock `useProgramIdls` with both IDLs and assert the name of the built `Program`.

## Comments and specs outside the diff

- [ ] In the `resolveProgramIdlsClient` docblock in [load-resolve-program-idls.ts](../app/entities/idl/api/load-resolve-program-idls.ts), replace "(the tx-decoder takes `anchorIdl`, the program-name label takes `programMetadataIdl`)" with "consumers read the PMP-first `candidates` from `useProgramIdls`". Replace "broadly-used `useAnchorProgram`" with "broadly-used `useProgramIdls`". `useAnchorProgram` takes an IDL argument and calls no hook that fetches.
- [ ] In `DeployedProgramVerifiedBuildCard` in [VerifiedBuildCard.tsx](../app/components/account/VerifiedBuildCard.tsx), replace "(useProgramIdls via useAnchorProgram)" with "(useProgramIdls)". `useEnrichedOsecInfo` calls `useProgramIdls` directly.
- [ ] In the requirement "Single IDL-resolution endpoint backed by `@solana/idl`" in [spec.md](../openspec/changes/consolidate-idl-resolution/specs/program-idl-resolution/spec.md), replace "the inspector's `useAnchorProgram`" with "the inspector's `useIdlInstructionDecode`". `useAnchorProgram` reads no endpoint.

## PR description

- [ ] Add a Behavior Changes bullet: "The Anchor Data tab is hidden, and the Anchor Data card shows `No Anchor IDL found`, for a program whose only Anchor IDL declares no account types." The base showed the tab and `Failed to decode account data according to the public Anchor interface`.
- [ ] Change the `metadata.address` bullet to "The IDL tab hides a legacy Anchor IDL whose `metadata.address` names another program, behind the program ID mismatch warning." `IdlCard` renders `BaseWarningCard` in place of `IdlSection` on a mismatch, so "warns" understates the change.
- [ ] Add a Behavior Changes bullet: "The Anchor Data card shows `Loading program IDL` while the IDLs load." The base showed `No Anchor IDL found` until the IDLs arrived.
- [ ] Add a Behavior Changes bullet: "The Anchor Data card shows camelCase field names for a PMP-only Anchor IDL." The card reads `Program.idl`, which Anchor converts to camelCase.
- [ ] Change the bundle sentence to "Every `/address/[address]/*` route except `/address/[address]/idl` drops 20 to 30 kB of First Load JS." The `/address/[address]/idl` route stays at 980 kB.
- [ ] Change the first sentence to "so every caller reads a program's IDLs in the same PMP-first order". For a Codama PMP IDL and an Anchor IDL account, the Anchor callers read the Anchor IDL account.
- [ ] Narrow the Changes bullet on the IDL choice. `useProgramIdlNames` still orders `[idls.programMetadataIdl, idls.anchorIdl]` itself, and Squads and verified builds bypass the candidate list.
- [ ] Narrow the Changes bullet on `getIdlDeclaredAddress` to the mismatch check and the instruction decoder. `convertLegacyIdl` and `AnchorInterpreter` still read the declared address directly.
- [ ] Reword or delete the bullet on the Codama conversion fallback. The `ErrorBoundary` in [program-name.tsx](../app/utils/program-name.tsx) already showed the Anchor program name on the base.
- [ ] Recount the line totals after the review tests land.

## Nits

- [x] Drop `onChain` and `isOnChainLoading` from `ProgramIdls`, so the type holds each IDL and the loading state once. Make `getOnChainAnchorIdl` filter `candidates` by `source === 'anchor'`.
- [x] Make `getIdlDeclaredAddress` test only `standard === 'codama'`, the rule that `getIdlSpecType` uses.
- [x] Make `isIdlProgramIdMismatch` return `true` for a declared address that is not a string. The base sent that value to `new PublicKey` and returned `true` from the `catch`. `getIdlDeclaredAddress` returns `IdlDeclaredAddress`, so the check can tell a malformed address from no address.
- [x] In [idl-candidates.ts](../app/entities/idl/model/idl-candidates.ts), type `source` as `IdlVariant`, rename `SourcedIdl.address` to `idlAddress`, and replace the casts in `tagIdl` with a type predicate.
- [x] Fix the comments:
    - In `IdlCard`, change "an Anchor IDL comes first" to "the Anchor IDL account comes first".
    - Delete the `convertAnchorIdl` comment, because "the decoder" names no symbol.
    - Delete the docblocks of `useIdlInstructionDecode` and `TaggedIdl`, because both restate the code.
    - Shorten the comments in [@x/program-metadata/index.ts](../app/entities/idl/@x/program-metadata/index.ts) and `AccountDataTab`.
    - Replace the em-dashes in the mock comment of `use-idl-instruction-decode.spec.ts`.
- [x] Fix the test titles:
    - In `use-program-idls.spec.tsx`, change "no candidates" to "undefined candidates".
    - In `program-name.spec.tsx`, change "until the candidates are final" to "when the candidates are undefined", because a suspense read never renders while the IDLs load.
    - Change "the Anchor IDL account" to "the Anchor IDL" where the input is the IDL: `idl-candidates.spec.ts`, `use-idl-instruction-decode.spec.ts` and `AnchorAccountCard.spec.tsx`.
    - Split the `getIdlDeclaredAddress` table in `utils.spec.ts` into rows that return an address and rows that return `undefined`.
    - Keep the order wording in the `getOnChainCandidates` table only on the row with both IDLs.
- [x] Fix the spec fixtures:
    - Make the `useProgramIdls` mocks a `vi.fn` and assert the program address they receive.
    - Add a fee payer and the program to the jsonParsed stub in `ProgramLogsCardBody.spec.tsx`.
    - Make the PMP stub in `use-idl-instruction-decode.spec.ts` a real Codama root.
    - Add a custom-cluster loading case to `use-program-idls.spec.tsx`.
    - Delete the second assertion of the loading case in `AnchorAccountCard.spec.tsx`, because no IDL reaches the card while `candidates` is `undefined`.
    - Replace the one-row `it.each` table in `program-name.spec.tsx` with a plain `it`.
- [x] Delete the `HOOKS_PENDING_CLIENT_ONLY` entry for the deleted `use-program-metadata-idl.tsx` in [eslint.config.mjs](../eslint.config.mjs).
