# Proposal: Show instruction intents from sRFC 39 display metadata

## Context

- A program can publish sRFC 39 `display` metadata in its Codama IDL: a short intent label and a sentence template
  per instruction, for example `Transfer ${data.amount} from ${accounts.source} to ${accounts.destination}`. The
  `solana-program/system` and `solana-program/token` IDLs carry it.
- `@codama/dynamic-instructions` turns a parsed instruction and its IDL into that sentence. To scale an amount it
  can read accounts, for example a mint's `decimals`, and it calls the caller's `fetchAccount` for every read with
  no cache.

## Why

### Placement

- **Entity slice `entities/instruction-intent` (picked).** Intents serve instruction cards (`app/components`), the
  transaction summary (`features/transaction`), and the interactive IDL (`features/idl`). A feature cannot import
  another feature, so only an entity serves all three without boundary exemptions. It reads the IDL and the cluster
  through `@x` APIs.
- **Inside `entities/idl`.** No `@x` API needed, but the IDL slice would take on a second domain: display, account
  reads, and UI.
- **A feature slice.** Unreachable from `features/idl` and `features/transaction` without exemptions.

### Account reads

- **Two-level SWR (picked).** The accounts a display reads are planned without RPC (`getRequiredAccountsForDisplay`)
  and fetched in one `getMultipleAccounts` call, cached by the sorted address set (L1). The computation is cached by
  instruction content (L2). Identical instructions share L2, instructions that read the same accounts share L1, and
  the transaction summary reuses both entries from the cards. `fetchAccount` reads only the L1 map.
- **One SWR per instruction.** Shorter, but instructions that read the same mint fetch it again.
- **A Next API route.** Account data is live state, so a CDN cache would serve stale data, and custom clusters need
  a browser path anyway.

`getRequiredAccountsForDisplay` skips accounts inside arrays. An amount that depends on such an account renders
unscaled, and the SDK withholds the sentence.

### Instruction bytes

- **The raw transaction (picked).** `SummaryCard` fetches the base64 transaction on mount, so the bytes need no
  extra RPC call. For legacy and v0, `fetchRawTransaction` already decompiles the message with its lookup tables
  resolved, and `toKitInstruction` converts those instructions. A v1 message has no lookup tables, so Kit's
  `decompileTransactionMessage` reads it straight from `messageBytes`.
- **Kit for every version, lookup tables rebuilt from `meta.loadedAddresses`.** One code path, but it repeats the
  lookup resolution `fetchRawTransaction` already does, and it needs the fetcher to keep `loadedAddresses`.

Inner instructions come from the same response. `fetchRawTransaction` keeps `meta.loadedAddresses`, and
`getInnerInstructionsFromRawTransaction` resolves the compiled `meta.innerInstructions` against the static keys and
the loaded addresses. The cards come from the parsed response and the bytes from the raw one, so a card whose raw
instruction belongs to another program reads `failed` instead of showing a wrong intent.

### Eager check, lazy fetch

The IDL support check and the instruction parse run on render, so the Intent button is dashed before a click when
no intent exists. Both are synchronous, need no RPC call, and use only packages the app already ships.

The intent computation starts after the first open of Intent panel. The `@codama/dynamic-instructions` is loaded through dynamic `import()`.

### Card state

`useInstructionIntent` resolves the card state with early returns over its own hook results: support, the bytes, the
existence check, the account read, the computation.

### UI wiring

The design puts the button in the card header and the intent row at the top of the card body. A per-card
`InstructionIntentProvider` holds the open state and the result, and two consumers read it. Inner cards render
inside their parent card, so each provider carries the `innerIxIndex` of its card and the consumers render only
for the card with the same `innerIxIndex`.

## What Changes

- Entity `app/entities/instruction-intent`: the support check, the existence check, the intent computation, the
  ui components.
- Dependency `@codama/dynamic-instructions` 1.0.0.
- `entities/idl` and `entities/cluster` gain `@x/instruction-intent`. `useProgramIdls` returns the fetch `error`.
- `Button` gains a `dashed` variant. `abbreviateAddress` is exported from `AddressLink`.
- `entities/transaction-data` gains `getInstructionsFromRawTransaction` and `getInnerInstructionsFromRawTransaction`.
  `RawTransaction.meta` keeps `loadedAddresses`.
- Both `InstructionsSection` components mount a provider per top-level and per inner card. `BaseInstructionCard` and
  `InspectorInstructionCard` place the button and the row.

## Impact

- Intents show only for programs whose Program Metadata IDL carries templates. Other cards show the dashed button.
- First Load JS is unchanged on every route. The SDK (about 12 kB gzip) loads on the first Intent open.
- Accepted risk: account data is read when the page is viewed, not at the transaction's slot.
- Accepted risk: a program can publish broken metadata. A throw from the parse, the account plan, or the
  computation is caught and shown as the `malformed-metadata` reason.
