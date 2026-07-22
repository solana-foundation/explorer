# @explorer/idl-decode

One small client over Solana program IDLs: detection, names, and decoding, regardless of which
standard produced the IDL.

- **Anchor** — modern IDLs (`metadata.spec`), emitted by `anchor build` since 0.30
- **Codama** — root nodes, as the program-metadata program (PMP) stores them
- **Legacy Anchor** — pre-0.30 IDLs convert internally at creation (nodes-from-anchor handles the
  legacy shape too); pass `programAddress` when the IDL declares none

## Entries

Every entry is side-effect-free and tree-shakeable (gated).

| Import                | Ships                                                             |
| --------------------- | ------------------------------------------------------------------ |
| `@explorer/idl-decode`        | client (codama decode engine by default), guards, names, errors, types |
| `@explorer/idl-decode/codama` | the codama engine pieces (`codamaProvider`, decode functions) for explicit wiring |
| `@explorer/idl-decode/anchor` | Anchor IDL helpers (`convertToCodama`)                        |
| `@explorer/idl-decode/fetch`  | fetch the IDL by program address (`fetchIdlClient`)           |

## Quick start

`tryCreate*` never throws on untrusted JSON — it returns an error-first tuple. The `error` is a plain
value: branch on it (every example below does), or throw it if you prefer exceptions.

```ts
import { isCodamaStandard, isIdlError, IDL_ERROR__UNSUPPORTED_IDL_FORMAT, tryCreateIdlClient } from '@explorer/idl-decode';

const [error, client] = tryCreateIdlClient(fetchedJson);
if (error) throw error; // code-discriminated: isIdlError(error, IDL_ERROR__UNSUPPORTED_IDL_FORMAT)

client.programName(); // 'Token'
client.programAddress(); // 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
client.instructionName(instructionData); // 'Transfer'
isCodamaStandard(client); // narrows the client to one standard
```

## Names-only client

`createIdlMetaClient` returns a metadata client — decode methods are statically absent
(`tryCreateIdlMetaClient` is its error-first mirror for untrusted input):

```ts
import { createIdlMetaClient, type IdlMetaClient } from '@explorer/idl-decode';

// names and metadata only — decode methods do not exist on the type
const meta: IdlMetaClient = createIdlMetaClient(idl);

meta.programName(); // 'Token' — undefined if the IDL declares none
meta.programAddress(); // 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
meta.programVersion(); // '3.3.0' — the program's own semver, undefined if absent
meta.formatVersion(); // Codama root version, or Anchor's metadata.spec
```

`instructionName` resolves an instruction's name from its data bytes alone — a longest-prefix match
against the IDL's discriminators, no decode engine needed. Pass the raw `data` of a `@solana/kit`
instruction:

```ts
meta.instructionName(instruction.data); // 'Transfer' — undefined when no discriminator matches
```

## Decoding client

`createIdlClient` decodes with the codama engine by default — no configuration for the common case:

```ts
import { createIdlClient, type IdlClient } from '@explorer/idl-decode';

// the metadata surface plus decode methods, codama engine pre-wired
const client: IdlClient = createIdlClient(idl);
```

The engine stays swappable — pass `provider` to plug in another one (heavier engines, the
Anchor-rich path) through the same client surface:

```ts
import { codamaProvider } from '@explorer/idl-decode/codama';

// the explicit form of the default — any IdlDecodeProvider plugs in here
const same: IdlClient = createIdlClient(idl, { provider: codamaProvider() });
```

## Decoding instructions

The two-step primitive behind `decodeInstructionData` — decode to a result discriminated by the
producing standard (`decode.kind`), then read the payload. A miss is `{ kind: 'unknown', errors: [] }`;
a pipeline failure carries its errors. One deliberate throw remains on this two-step route: an
instruction whose `programAddress` differs from the IDL's declared address is a wiring bug —
`IDL_ERROR__IDL_ADDRESS_MISMATCH` (the one-step routes return it as the error value instead).
`unwrap` is the recommended access — it narrows to the default (codama) arm and surfaces the payload
with its matched schema node, or throws a typed `IdlError` for any other arm:

```ts
import { createIdlClient, unwrap } from '@explorer/idl-decode';

const client = createIdlClient(idl);
const decode = client.decodeInstruction(instruction); // a @solana/kit Instruction

const { data, node } = unwrap(decode); // payload + the matched InstructionNode
```

The result is still just a discriminated union — branch on `decode.kind` when you want the miss and
failure arms as values instead of a throw:

```ts
import { IdlStandard } from '@explorer/idl-decode';

if (decode.kind === IdlStandard.Codama) {
    const args = client.getDecodedData<{ amount: bigint }>(decode); // u64 → bigint, pubkey → base58 string
}
```

`decodeInstruction` also accepts a handler map instead of an `if` — the map is exhaustive: one
branch per arm the client's type carries. A Codama-root client (native or converted) carries only
`codama` / `unknown`, so the map buys little there:

```ts
const args = client.decodeInstruction(instruction, {
    codama: decode => client.getDecodedData<{ amount: bigint }>(decode),
    unknown: () => undefined,
});
```

A raw Anchor IDL client also carries `anchor`, so its map must include that branch — even though the
arm only fires once a fallback decoder fills it (see [below](#legacy-anchor-idls)).

## Decoding accounts

The account counterpart of `decodeInstruction` — the two-step primitive behind `decodeAccountData`,
same shape, same `unwrap`:

```ts
const { data, node } = unwrap(client.decodeAccount(accountData)); // payload + the matched AccountNode
```

`decodeAccount` takes the same handler map as `decodeInstruction`. A Codama-root client's map is
`codama` / `unknown`:

```ts
const summary = client.decodeAccount(accountData, {
    codama: decode => client.getDecodedData<{ authority: string }>(decode),
    unknown: () => undefined,
});
```

A raw Anchor IDL client also carries the `anchor` branch — like the instruction side, it fires only
when a wired `fallbackDecoder.decodeAccount` rescues data the pipeline missed (see
[below](#legacy-anchor-idls)).

## Typed payloads — when knowledge exists

Two axes decide what the decode routes can type: the IDL's **standard**, and **when** you know the
program — *build time* (a type is present → static typings) or *runtime* (only the fetched JSON
exists → payloads type as `unknown`, but the decode carries the exact schema). Every sample below is
executable: [`__tests__/readme-flows.integration.spec.ts`](./__tests__/readme-flows.integration.spec.ts)
runs them with type assertions.

### Codama IDLs · build time

**The schema is the type source — zero generics.** The only requirement is that the IDL is TS source
(`as const`) so the compiler can read it; JSON imports widen and lose inference. The RootNode TS
variant may already be accessible (shipped by the program), or **built in advance** — run the
anchor→codama conversion at build time and save the result:

```ts
import { createIdlClient } from '@explorer/idl-decode';
import { vaultIdl } from './idl/vault'; // `as const` root node — the IDL IS the type

const client = createIdlClient(vaultIdl);

const [, data] = client.decodeInstructionData(instruction);
//        ^? { amount: bigint; discriminator: number } | undefined — read off the schema's `deposit` instruction
```

**Pick account payloads by name.** `AccountsDataOf` keys the inferred payloads by account name — and
doubles as the decode-shape reference, because inferred types mirror what the parser *returns*, not
the on-chain layout:

```ts
import type { AccountsDataOf } from '@explorer/idl-decode';

type ConfigAccount = AccountsDataOf<typeof nttIdl>['config'];
//   ^? {
//        discriminator: [string, string]; // bytes → [encoding, data] tuple, NOT Uint8Array
//        owner: string;                   // Address/pubkey → plain base58 string, NOT a branded Address
//        pendingOwner:                    // Option<pubkey> → kit {__option} object, NOT `string | null`
//            | { __option: 'None' }
//            | { __option: 'Some'; value: string };
//        mode: number;                    // scalar enum → its variant INDEX, NOT the variant name
//        chainId: { id: number };         // defined type → resolved inline
//        enabledTransceivers: { map: bigint }; // u128 (and u64/i64/i128) → bigint, NOT number
//        paused: boolean;
//        // …
//      }
```

**Refine a fetched IDL with a generated client type.** renderers-js types describe the codec view
(`Address` pubkeys, `Uint8Array` bytes) which the parser does not uphold — pass them through
`AsDecoded<T>` (see its JSDoc for the mapping).

### Codama IDLs · runtime

**Payloads unknown, values exact.** A runtime-fetched root is the wide `CodamaIdl` — names and kinds
are plain strings, nothing to infer from. Decoding still works exactly; only the static guidance is
absent (claim a shape per call when you know it: `decodeAccountData<{ m: number }>(…)`):

```ts
const idl: CodamaIdl = await fetchIdlFromChain(programId); // wide — no literal type
const client = createIdlClient(idl);

const [, data] = client.decodeAccountData(accountData);
//        ^? unknown — a wide IDL carries no literals to read; the value is still exact at runtime
```

**The decode carries the exact schema.** No type exists for a fetched IDL, but the two-step route
keeps the whole decode envelope — `unwrap` narrows to the default (codama) arm (a different arm
throws a typed `IdlError`) and surfaces the matched schema node; unknown-program consumers render by
node kind, never by value shape:

```ts
import { unwrap } from '@explorer/idl-decode';

const { data, node } = unwrap(client.decodeAccount(accountData));
//            ^? node: AccountNode — the exact schema, at runtime; data stays unknown

if (node.data.kind === 'structTypeNode') {
    node.data.fields.map(field => `${field.name}: ${field.type.kind}`);
    // ['m: numberTypeNode', 'n: numberTypeNode', 'isInitialized: booleanTypeNode', 'signers: arrayTypeNode']
}
```

### Anchor IDLs · build time

**The satellite type anchor emits — zero generics.** `anchor build` writes a TS type next to the
JSON (`target/types`); pair them (`idlJson as unknown as MyProgram`, or fetch with
`Program.fetchIdl<MyProgram>`) and payloads infer from the IDL itself — one union member per
declared instruction.

The strongest anchor route, though, is the codama one above: convert the anchor JSON **at build
time** (`convertToCodama` / nodes-from-anchor), save the root `as const`, and the full codama
inference applies to the anchor-born program.

### Anchor IDLs · runtime

Same rule as any runtime IDL: payloads type as `unknown` (claim a shape per call when you know it),
and the exact schema still arrives with every decode — the engine creates it from the anchor JSON
internally via nodes-from-anchor:

```ts
const { data, node } = unwrap(client.decodeInstruction(instruction));
//            ^? node: InstructionNode — born from the anchor JSON
node.arguments.map(argument => `${argument.name}: ${argument.type.kind}`);
// ['discriminator: fixedSizeTypeNode', 'amount: numberTypeNode']
```

### Schema-paired entries · unknown programs

**One row per value, each paired with its schema node.** With no payload type to claim,
`getDecodedEntries` turns the decode into presentable rows: `path` says where the value lives,
`node` says what it is; rendering dispatches on `node.kind`, never on the value's JS shape. The
traversal is the package's job — links resolved, size wrappers penetrated, options unwrapped,
nesting flattened. A non-codama arm throws the same typed kind mismatch as `unwrap`:

```ts
import { createIdlClient, findEntryOfKind, getDecodedEntries, joinPath } from '@explorer/idl-decode';

const idl: CodamaIdl = await fetchIdlFromChain(programId); // wide — no payload type anywhere
const client = createIdlClient(idl);

const entries = getDecodedEntries(client.decodeInstruction(instruction));
//    ^? DecodedEntry[] — { path, node, value } per leaf
entries.map(joinPath); // one key per field — nested payloads flatten to dot paths ('chainId.id')

// focus one field — findEntryOfKind narrows the node, so kind-specific fields read typed
const amount = findEntryOfKind(entries, 'amount', 'numberTypeNode');
amount?.node.format; // how the program declared the field — 'u64'
amount?.value; // the decoded value, already in that format's runtime shape — a bigint
```

**The anchor origin is invisible.** An anchor IDL goes through the same call — the internal
conversion pairs its leaves with codama nodes too, so one schema-driven renderer serves both
standards.

## Anchor IDLs

Anchor IDLs go through the same client — the codama engine runs nodes-from-anchor to convert
the IDL to a Codama root before decoding, so a successful decode lands on the codama arm:

```ts
import anchorIdl from './target/idl/my_program.json';

const client = createIdlClient(anchorIdl);
const decode = client.decodeInstruction(instruction);
decode.kind; // IdlStandard.Codama — the conversion is an implementation detail
```

To run that conversion yourself — to catch a nodes-from-anchor failure explicitly — convert first:

```ts
import { convertToCodama } from '@explorer/idl-decode/anchor';

const [error, root] = convertToCodama(anchorIdl); // nodes-from-anchor
// error → IDL_ERROR__IDL_PARSE_FAILED (the IDL could not be converted); handle it as a value
if (!error) {
    const client = createIdlClient(root); // root is already a Codama IDL
}
```

Left to convert internally, a nodes-from-anchor failure is *not* silent: the decode falls to the
`unknown` arm with the conversion error in `decode.errors` — a pipeline failure, not a plain miss
(`errors: []`). With a `fallbackDecoder` wired, a successful rescue lands on the `anchor` arm
instead, the conversion error preserved in `recoveredFrom`.

## Legacy Anchor IDLs

Pre-0.30 IDLs go through the same client — creation converts them internally (nodes-from-anchor
handles the legacy shape too). One requirement: the program address must resolve — the IDL's own
`metadata.address` when present, `options.programAddress` otherwise (real `anchor build` 0.29 output
declares none); neither → typed `IDL_ERROR__PROGRAM_ADDRESS_REQUIRED`:

```ts
import { createIdlClient, isLegacyAnchorIdl } from '@explorer/idl-decode';

isLegacyAnchorIdl(idl); // true → creation converts it; the address option applies

const client = createIdlClient(idl, { programAddress });
client.instructionName(instruction.data); // works — legacy IDLs declare no discriminators; the conversion derives them
const decode = client.decodeInstruction(instruction); // lands on the codama arm, like any converted IDL
```

The names-only client takes the same option — legacy metainfo is scattered across the JSON, so the
meta surface also reads the converted root:

```ts
const meta = createIdlMetaClient(idl, { programAddress });
```

To run the conversion yourself, `convertToCodama` accepts the legacy shape too; the root comes back
with an empty program address — inject it before creating the client.

IDLs the conversion route cannot handle get an injected escape hatch — its result lands in the
anchor arm, for instructions and accounts alike:

```ts
const client = createIdlClient(idl, {
    fallbackDecoder: {
        decodeAccount: (idl, data) => myCustomAccountDecode(idl, data),
        decodeInstruction: (idl, ix) => myCustomDecode(idl, ix),
    },
});
```

The decoder's return value picks the arm: return a value and the decode lands on the `anchor` arm;
return `undefined` and it falls through to the `unknown` arm. It never guesses — no rescue means no
anchor result.

Here all three arms are live — the handler map is worth it: `codama` for instructions the
conversion decoded, `anchor` for those your fallback decoder rescued, `unknown` for the rest:

```ts
const client = createIdlClient(idl, { fallbackDecoder });

const label = client.decodeInstruction(instruction, {
    codama: decode => client.getDecodedData(decode), // converted + decoded natively
    anchor: decode => decode.decoded, // rescued by your fallback decoder (decode.recoveredFrom holds bypassed errors)
    unknown: () => undefined,
});
```

## Errors

`IdlError` with stable numeric codes (`IDL_ERROR__*`) and per-code typed context, modelled on
`@codama/errors`; `isIdlError(e, code)` narrows both. Unknown-arm contract: `errors: []` = the
bytes did not match; non-empty = the pipeline failed and tells you where.

## Fetching the IDL

Everything above assumes you already hold the IDL. `@explorer/idl-decode/fetch` resolves it **by program
address** — whatever the program publishes — and hands back a ready decode client. The codama engine
is the default here (pass `provider` to swap):

```ts
import { fetchIdlClient } from '@explorer/idl-decode/fetch';

const controller = new AbortController();
const [error, client] = await fetchIdlClient(programAddress, {
    abortSignal: controller.signal, // optional — aborting REJECTS with the abort reason
    rpc, // createSolanaRpc(url)
});
if (!error) {
    client.decodeInstruction(instruction); // works no matter which standard the program publishes
}
```

The default resolution is the program's "latest" IDL: the PMP `idl` metadata first (via
`@solana-program/program-metadata` — a peer of this entry), then the Anchor IDL PDA as the fallback
(a kit-native, abortable mirror of anchor's `Program.fetchIdl`). An absent IDL lands as
`IDL_ERROR__IDL_NOT_FOUND` in the Result; a transport failure as `IDL_ERROR__IDL_FETCH_FAILED` with
its cause — a blip stays retryable and is never mistaken for "no IDL". A fetched IDL declaring a
**different** program address is rejected as `IDL_ERROR__IDL_ADDRESS_MISMATCH` (registries and custom
fetchers can serve mislabeled ones) — pass `verifyAddress: false` to accept it anyway.

Any other source (a registry, a cache, an anchor-provider wrap) plugs in through the `fetcher`
option — an `IdlFetcher` resolves the raw IDL JSON, resolves `undefined` when the program has none,
and throws only on transport failure or abort. With a `fetcher` the `rpc` requirement drops.
`createLatestIdlFetcher(rpc, { anchor, authority })` — the default's building block — is exported
too, for skipping the Anchor leg (native programs) or reading a non-canonical PMP authority.

## From a transaction

Every instruction decode above takes a `@solana/kit` `Instruction` — usually one pulled from a transaction.
[`@solana/transaction-introspection`](https://www.solanakit.com/docs/advanced-guides/transaction-introspection)
turns a confirmed transaction into kit `Instruction`s — exactly what `decodeInstruction` consumes.
This library never depends on introspection; a consumer that already uses it feeds its output straight in:

```ts
import { walkInstructions } from '@solana/transaction-introspection';

// walkInstructions yields every instruction of a confirmed transaction — outer calls and their inner
// CPI results — as kit Instructions (see the introspection guide for assembling its inputs)
for (const instruction of walkInstructions({ compiledMessage, loadedAddresses, meta })) {
    const [, data] = client.decodeInstructionData(instruction); // the same call as anywhere else
    if (data) render(data, instruction.trace); // trace tells you outer[i] from inner[outer/inner]
}
```

For a single call with no CPI traversal, `getInstructionsFromCompiledTransactionMessage(compiledMessage)`
resolves the outer instructions from a compiled message alone — no meta needed (v0 messages loading
accounts from lookup tables still need `loadedAddresses`, which comes from the meta). Both routes are
executable: [`__tests__/transaction-introspection.integration.spec.ts`](./__tests__/transaction-introspection.integration.spec.ts)
runs them over in-memory transactions, inference intact. Assembling the inputs from a fetched
transaction is introspection's territory — the [guide](https://www.solanakit.com/docs/advanced-guides/transaction-introspection) and the
[package README](https://github.com/anza-xyz/kit/tree/main/packages/transaction-introspection) cover it.

## Development

```sh
pnpm --filter @explorer/idl-decode test           # typecheck → unit → integration → tree-shakeability
pnpm --filter @explorer/idl-decode test:coverage  # v8 runtime coverage + strict type-coverage
```

Fixture programs: [DEVELOPMENT.md](./DEVELOPMENT.md). Architecture and decisions: [DESIGN.md](./DESIGN.md).
