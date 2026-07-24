// README-level consumer flows — one case per way a user meets the library, written to be lifted
// into the README verbatim. Same engine everywhere (the default codama engine); the axes are the input standard
// and WHEN knowledge exists: build time (a type is present → static typings) vs runtime (only the
// fetched JSON exists → exact schema in the decode, payloads statically unknown).
//   codama IDLs
//     build time — 1. the schema as the type source; 2. field-shape cheat sheet; 3. a generated
//                  client type refines a fetched IDL (AsDecoded bridges the codec view); 4. a
//                  PUBLISHED client type through the same bridge; 5. AsDecoded on the instruction
//                  side; 6. a companion type asserted onto a runtime conversion
//     runtime    — 7. payloads unknown, values exact; 8. the decode carries the exact schema;
//                  9. the hand-written claim where codegen is rejected
//   anchor IDLs (decoded through the same codama engine)
//     build time — 10. the satellite type anchor emits; 11. the satellite type passed explicitly;
//                  12. the satellite also types account payloads
//     runtime    — 13. payloads unknown + the per-call claim; 14. the schema is CREATED from the
//                  anchor JSON by the internal conversion; 15. a legacy (pre-0.30) IDL converts
//                  at creation (program address required)
//   schema-paired entries (its own section) — 16. getDecodedEntries flattens the codama arm into
//                  node-paired leaves; 17. one entries shape serves anchor-born programs too;
//                  18. a consumer renderer dispatches on entry node kinds
// `decodeInstructionData`/`decodeAccountData` are the one-step routes (typed payload as an
// error-first Result); `unwrap` narrows the two-step route to the default (codama) arm (payload + schema node).
import {
    type AccountsDataOf,
    type AsDecoded,
    type CodamaIdl,
    createIdlClient,
    type DecodedEntry,
    findEntryOfKind,
    getDecodedEntries,
    getEnumVariantName,
    joinPath,
    unwrap,
} from '@explorer/idl-decode';
import { convertToCodama } from '@explorer/idl-decode/anchor';
import { exampleNativeTokenTransfersIdl } from '@explorer/test-idl-program-example-native-token-transfers/codama';
import { vaultIdl } from '@explorer/test-idl-program-vault';
// the wide anchor IDL type is anchor's own — the library's AnchorIdl is a direct alias of it
import type { Idl } from '@coral-xyz/anchor';
// real-world interop: a PUBLISHED renderers-js-generated client (type-only import, erased at runtime)
import type { Multisig as PublishedMultisig } from '@solana-program/token-2022';
import { address } from '@solana/kit';
// an IDL renderers-js REJECTS (circular account defaults) — the hand-written claim is the only typed route
import exampleIdl from 'codama-fixtures/packages/dynamic-client/test/programs/idls/example-idl.json';
import { describe, expect, expectTypeOf, it } from 'vitest';

import {
    depositIx,
    incrementIx,
    loadNtt029Idl,
    loadSimpleIdl,
    loadSimpleIdlTyped,
    loadTokenkegIdl,
    NTT_PROGRAM_ADDRESS,
    NTT_TRANSFER_BURN_DISCRIMINATOR,
    type Simple,
    type Simple031,
    transferIx,
    u64le,
} from '../src/__tests__/fixtures';
import { counterAccountData, fetchAnchorIdl } from './anchor-helpers';
import { base16, base64, DEFAULT_ADDRESS, encodeAccount } from './codama-helpers';
// renderers-js output for SPL Token — type-only imports, erased at runtime
import type { Multisig } from './generated/token-client/accounts/multisig';
import type { SyncNativeInstructionData } from './generated/token-client/instructions/syncNative';

// a token multisig account value, shared by the fetched-tokenkeg cases
const MULTISIG = {
    isInitialized: true,
    m: 1,
    n: 1,
    signers: Array.from({ length: 11 }, () => DEFAULT_ADDRESS),
};

/** A complete legacy-NTT transferBurn instruction: TransferArgs{amount 42, chain 1, 32-byte recipient, no queue}. */
const transferBurnIx = {
    accounts: [],
    data: new Uint8Array([
        ...NTT_TRANSFER_BURN_DISCRIMINATOR,
        ...u64le(42n),
        1,
        0, // recipientChain.id (u16 le)
        ...Array.from({ length: 32 }, () => 7), // recipientAddress
        0, // shouldQueue
    ]),
    programAddress: address(NTT_PROGRAM_ADDRESS),
};

/** A consumer's per-leaf formatter for the entries renderer case — dispatches on the node kind, never the value shape. */
const renderEntry = (entry: DecodedEntry): string => {
    const { node, value } = entry;
    switch (node.kind) {
        case 'publicKeyTypeNode':
            return `address(${String(value)})`;
        case 'numberTypeNode':
            return `${node.format}(${String(value)})`;
        case 'booleanTypeNode':
            return value ? 'yes' : 'no';
        case 'bytesTypeNode':
            // dynamic-parsers hands bytes back as an [encoding, data] tuple
            return Array.isArray(value) ? `bytes(${String(value[1])})` : String(value);
        case 'enumTypeNode':
            // decoded as the variant index — the library names it back from the entry's node
            return getEnumVariantName(entry) ?? String(value);
        default:
            // an option that decoded to None is the only undefined-valued entry
            return value === undefined ? 'none' : (JSON.stringify(value) ?? String(value));
    }
};

describe('README flows: how payload types reach the consumer', () => {
    describe('codama IDLs', () => {
        describe('build time — a type is present', () => {
            it('should infer payloads from the IDL schema itself with zero generics', () => {
                // the schema is the type source — no generics, no companion types; the only requirement is
                // that the IDL is bundled as TS source (`as const`) so the compiler can read it.
                // The RootNode TS variant may already be accessible (shipped by the program, like vaultIdl)
                // or built in advance — run the anchor→codama conversion at build time and save the result.
                const client = createIdlClient(vaultIdl);
                //                             ^? vaultIdl: { readonly kind: "rootNode"; readonly program: { readonly name: "vault"; … instructions: [{ readonly name: "deposit"; … }] } } — every field is a literal

                // the instruction arrives from elsewhere (a transaction) — the fixture builds deposit(42)
                const [, data] = client.decodeInstructionData(depositIx(vaultIdl));
                //        ^? data: { amount: bigint; discriminator: number } | undefined — read off the schema's `deposit` instruction

                expectTypeOf(data).toEqualTypeOf<{ amount: bigint; discriminator: number } | undefined>();
                expect(data).toEqual({ amount: 42n, discriminator: 1 });
            });

            it('should infer parser-shaped field types where they differ from codec-level expectations', () => {
                // a generated codama IDL (converted wormhole NTT) — its config account collects every
                // field shape that surprises people coming from generated clients or anchor coders
                const client = createIdlClient(exampleNativeTokenTransfersIdl);
                //                             ^? exampleNativeTokenTransfersIdl: { readonly kind: "rootNode"; … } — a generated literal, same guidance as hand-written
                const bytes = encodeAccount(exampleNativeTokenTransfersIdl, 'config', {
                    bump: 254,
                    chainId: { id: 1 },
                    custody: DEFAULT_ADDRESS,
                    discriminator: base16('9b0caae01efacc82'),
                    enabledTransceivers: { map: 1n },
                    mint: DEFAULT_ADDRESS,
                    mode: 'burning',
                    nextTransceiverId: 1,
                    owner: DEFAULT_ADDRESS,
                    paused: false,
                    pendingOwner: null,
                    threshold: 1,
                    tokenProgram: DEFAULT_ADDRESS,
                });

                const [, data] = client.decodeAccountData(bytes);
                //        ^? union over every account the schema declares
                // AccountsDataOf keys the same payloads by account name — pick the member you mean
                type ConfigAccount = AccountsDataOf<typeof exampleNativeTokenTransfersIdl>['config'];

                // the whole inferred account in one place — each surprising shape shows its transformation
                expectTypeOf<ConfigAccount>().toEqualTypeOf<{
                    discriminator: [string, string]; // bytes → [encoding, data] tuple, NOT Uint8Array
                    bump: number; // u8 → number
                    owner: string; // Address/pubkey → plain base58 string, NOT a branded Address
                    pendingOwner: { __option: 'None' } | { __option: 'Some'; value: string }; // Option<pubkey> → kit {__option} object, NOT `string | null`
                    mint: string; // Address/pubkey → string
                    tokenProgram: string; // Address/pubkey → string
                    mode: number; // scalar enum → its variant INDEX, NOT the variant name
                    chainId: { id: number }; // defined type → resolved inline
                    nextTransceiverId: number;
                    threshold: number;
                    enabledTransceivers: { map: bigint }; // u128 (and u64/i64/i128) → bigint, NOT number
                    paused: boolean; // bool → boolean
                    custody: string;
                }>();

                expect(data).toMatchObject({
                    discriminator: base64('mwyq4B76zII='), // the same bytes, re-encoded as base64 by the parser
                    mode: 1, // 'burning' went in by name, its index came back out
                    owner: DEFAULT_ADDRESS,
                    pendingOwner: { __option: 'None' },
                });
            });

            it('should refine a fetched codama IDL with a generated client type via AsDecoded', () => {
                // the IDL arrives at runtime, but the TYPE was generated at build time (renderers-js) —
                // the consumer pairs them per call
                const tokenkeg = loadTokenkegIdl();
                const client = createIdlClient(tokenkeg);
                const bytes = encodeAccount(tokenkeg, 'multisig', MULTISIG);

                // the naive claim: the rendered client's own type describes the CODEC view —
                // signers: Address[], a branded promise the parser does not uphold
                const [, codecView] = client.decodeAccountData<Multisig>(bytes);
                //        ^? codecView: Multisig | undefined — trusted not verified, and subtly wrong
                expectTypeOf(codecView).toEqualTypeOf<Multisig | undefined>();

                // the right claim: AsDecoded (a library export) remaps the same generated type to what
                // the parser returns — branded Address → plain base58 string, bytes → [encoding, data]
                const [, refined] = client.decodeAccountData<AsDecoded<Multisig>>(bytes);
                //        ^? refined: { isInitialized: boolean; m: number; n: number; signers: string[] } | undefined
                expectTypeOf(refined).toEqualTypeOf<
                    { isInitialized: boolean; m: number; n: number; signers: string[] } | undefined
                >();
                expect(refined).toEqual(MULTISIG);
            });

            it('should reuse a PUBLISHED client type through the same AsDecoded bridge', () => {
                // nothing generated locally: the payload type ships in a published package
                // (@solana-program/token-2022) and bridges to parser output the same way
                const tokenkeg = loadTokenkegIdl();
                const client = createIdlClient(tokenkeg);
                const bytes = encodeAccount(tokenkeg, 'multisig', MULTISIG);

                const [, data] = client.decodeAccountData<AsDecoded<PublishedMultisig>>(bytes);
                //        ^? { isInitialized: boolean; m: number; n: number; signers: string[] } | undefined
                expectTypeOf(data).toEqualTypeOf<
                    { isInitialized: boolean; m: number; n: number; signers: string[] } | undefined
                >();
                expect(data).toEqual(MULTISIG);
            });

            it('should bridge instruction data types through AsDecoded too', () => {
                // the instruction-side twin of the account bridge — same remapping, and the raw IDL
                // alone decodes hand-built bytes (no codama tooling on the encode side)
                const tokenkeg = loadTokenkegIdl();
                const client = createIdlClient(tokenkeg);

                // the IDL declares syncNative as a single u8 discriminator (17) with no other data
                //        ↓? data: { discriminator: number } | undefined — the bridged instruction data type
                const [, data] = client.decodeInstructionData<AsDecoded<SyncNativeInstructionData>>({
                    accounts: [],
                    data: Uint8Array.from([17]),
                    programAddress: address(tokenkeg.program.publicKey),
                });
                expectTypeOf(data).toEqualTypeOf<{ discriminator: number } | undefined>();
                expect(data).toEqual({ discriminator: 17 });
            });

            it('should carry the companion inference when a runtime conversion is asserted as the pre-generated type', () => {
                // the type was generated in advance from the same IDL (the NTT codama literal);
                // the legacy JSON arrives at runtime — convert it, then assert the companion type on the root
                const [, root] = convertToCodama(loadNtt029Idl());
                if (!root) throw new Error('the vendored NTT IDL must convert');
                // this vendored legacy IDL carries no metadata.address — the consumer injects it from context
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- the companion assertion IS the flow
                const converted = {
                    ...root,
                    program: { ...root.program, publicKey: NTT_PROGRAM_ADDRESS },
                } as unknown as typeof exampleNativeTokenTransfersIdl;
                const client = createIdlClient(converted);

                const [, data] = client.decodeInstructionData(transferBurnIx);
                //        ^? data: a union over all 31 declared instructions | undefined — read off the asserted companion type

                // the compiler guidance is identical to the literal route — the transferBurn member of the union
                expectTypeOf<Extract<typeof data, { args: { amount: bigint } }>>().toEqualTypeOf<{
                    args: {
                        amount: bigint;
                        recipientAddress: [string, string];
                        recipientChain: { id: number };
                        shouldQueue: boolean;
                    };
                    discriminator: [string, string];
                }>();
                expect(data).toMatchObject({ args: { amount: 42n, recipientChain: { id: 1 }, shouldQueue: false } });
            });
        });

        describe('runtime — only the fetched JSON exists', () => {
            it('should keep decoding exact while typing payloads unknown for a fetched codama IDL', () => {
                // runtime acquisition (PMP fetch) — the wide CodamaIdl carries no literals
                const tokenkeg = loadTokenkegIdl();
                //    ^? tokenkeg: CodamaIdl — the wide RootNode; names and kinds are plain strings, nothing to infer from
                const client = createIdlClient(tokenkeg);
                const bytes = encodeAccount(tokenkeg, 'multisig', MULTISIG);

                // default inference degrades honestly: the value is exact at runtime, unknown statically
                const [, data] = client.decodeAccountData(bytes);
                //        ^? data: unknown — a wide IDL carries no literals to read
                expectTypeOf(data).toBeUnknown();
                expect(data).toMatchObject({ isInitialized: true, m: 1, n: 1 });
            });

            it('should carry the exact runtime schema alongside the statically unknown payload', () => {
                // the runtime counterpart of build-level typings: no type exists for a fetched IDL, but
                // the decode carries the matched schema node — consumers work schema-driven, not guessing
                const tokenkeg = loadTokenkegIdl();
                const client = createIdlClient(tokenkeg);
                const bytes = encodeAccount(tokenkeg, 'multisig', MULTISIG);

                // the two-step route: unwrap narrows to the default (codama) arm and surfaces the schema node
                const { data, node } = unwrap(client.decodeAccount(bytes));
                //            ^? node: AccountNode — the exact schema, at runtime
                expectTypeOf(data).toBeUnknown();
                //           ^? unknown statically — the schema below is the runtime substitute

                if (node.data.kind !== 'structTypeNode') throw new Error('expected a struct-shaped account');
                expect(node.name).toBe('multisig');
                // every field's declared kind is known exactly — rendering dispatches on it, never on the value
                expect(node.data.fields.map(field => `${field.name}: ${field.type.kind}`)).toEqual([
                    'm: numberTypeNode',
                    'n: numberTypeNode',
                    'isInitialized: booleanTypeNode',
                    'signers: arrayTypeNode',
                ]);
                // and nested kinds too: signers is an array OF pubkeys → render as address links
                const signers = node.data.fields.find(field => field.name === 'signers');
                expect(signers?.type.kind === 'arrayTypeNode' && signers.type.item.kind).toBe('publicKeyTypeNode');
            });

            it('should take a hand-written claim where codegen is rejected', () => {
                // renderers-js refuses this IDL (circular account defaults) — no generated type can
                // exist, so the per-call claim is the only typed route; the parser decodes it fine
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- the imported JSON is a known codama root
                const idl = exampleIdl as unknown as CodamaIdl;
                const client = createIdlClient(idl);
                const bytes = encodeAccount(idl, 'dataAccount1', {
                    bump: 255,
                    discriminator: base16('bd16d2a9c3062624'),
                    input: 0n,
                    optionalInput: null,
                });

                //        ↓? data: exactly the hand-written claim | undefined — trusted not verified
                const [, data] = client.decodeAccountData<{
                    bump: number;
                    discriminator: [string, string];
                    input: bigint;
                    optionalInput: { __option: 'None' } | { __option: 'Some'; value: string };
                }>(bytes);

                expect(data).toEqual({
                    bump: 255,
                    discriminator: base64('vRbSqcMGJiQ='),
                    input: 0n,
                    optionalInput: { __option: 'None' },
                });
            });
        });
    });

    describe('anchor IDLs (decoded through the same codama engine)', () => {
        describe('build time — a type is present', () => {
            it('should infer payloads from an anchor IDL paired with its satellite type', () => {
                // `anchor build` emits a TS satellite type next to the JSON — pairing them keeps the literals
                const simple = loadSimpleIdlTyped();
                //    ^? simple: Simple — the anchor-generated satellite type; names and arg types are literals
                const client = createIdlClient(simple);

                const [, data] = client.decodeInstructionData(incrementIx(simple));
                //        ^? data: { amount: bigint } | Record<string, never> | undefined — one member per declared instruction

                expectTypeOf(data).toEqualTypeOf<{ amount: bigint } | Record<string, never> | undefined>();
                expect(data).toMatchObject({ amount: 42n });
            });

            it('should infer payloads for an anchor IDL fetched with an explicit satellite generic', async () => {
                // the same pairing made explicit at the acquisition point: anchor's own
                // Program.fetchIdl<T> generic stamps the satellite type onto the fetched IDL
                const simple031 = await fetchAnchorIdl<Simple031>();
                //    ^? simple031: Simple031 — the satellite type, stamped by the fetch generic
                const client = createIdlClient(simple031);

                const [, data] = client.decodeInstructionData(incrementIx(simple031));
                //        ^? data: { amount: bigint } | Record<string, never> | undefined — same guidance, explicit source

                expectTypeOf(data).toEqualTypeOf<{ amount: bigint } | Record<string, never> | undefined>();
                expect(data).toMatchObject({ amount: 42n });
            });

            it('should infer account payloads from the satellite type too', async () => {
                // the satellite carries account structs as well — decodeAccountData infers them the
                // same way (the generated type's camelCase view matches the decoded keys)
                const simple = await fetchAnchorIdl<Simple>(loadSimpleIdl);
                const client = createIdlClient(simple);

                const [, data] = client.decodeAccountData(counterAccountData(simple));
                //        ^? data: { authority: string; count: bigint } | undefined — read off the satellite's counter account

                expectTypeOf(data).toEqualTypeOf<{ authority: string; count: bigint } | undefined>();
                expect(data).toMatchObject({ authority: DEFAULT_ADDRESS, count: 7n });
            });
        });

        describe('runtime — only the fetched JSON exists', () => {
            it('should keep decoding exact while typing payloads unknown for a bare anchor IDL', () => {
                // runtime acquisition with no satellite type — the wide AnchorIdl carries no literals
                const wide: Idl = loadSimpleIdl();
                //    ^? wide: Idl — anchor's own wide IDL type; instruction names/args are plain strings
                const client = createIdlClient(wide);

                // default inference degrades honestly: the value is exact at runtime, unknown statically
                const [, data] = client.decodeInstructionData(incrementIx(wide));
                //        ^? data: unknown — a wide IDL carries no literals to read
                expectTypeOf(data).toBeUnknown();
                expect(data).toMatchObject({ amount: 42n });

                // the per-call escape hatch: the consumer claims the shape where they know it —
                // the claim is compile-time only, the runtime value may carry more fields than claimed
                const [, claimed] = client.decodeInstructionData<{ amount: bigint }>(incrementIx(wide));
                //        ^? claimed: { amount: bigint } | undefined — exactly what was claimed, trusted not verified
                expectTypeOf(claimed).toEqualTypeOf<{ amount: bigint } | undefined>();
                expect(claimed).toMatchObject({ amount: 42n });
            });

            it('should create the runtime schema from the anchor JSON through the internal conversion', () => {
                // the anchor twin of the codama schema flow: no codama IDL ever existed here — the engine
                // converts the anchor JSON internally (nodes-from-anchor), so the decode still carries an
                // exact codama schema for the anchor-born program
                const wide: Idl = loadSimpleIdl();
                const client = createIdlClient(wide);

                const { data, node } = unwrap(client.decodeInstruction(incrementIx(wide)));
                //            ^? node: InstructionNode — born from the anchor JSON
                expectTypeOf(data).toBeUnknown();
                //           ^? unknown statically — same rule as any runtime IDL

                expect(node.name).toBe('increment');
                // the converted schema is exact: the declared discriminator plus each argument's kind
                expect(node.arguments.map(argument => `${argument.name}: ${argument.type.kind}`)).toEqual([
                    'discriminator: fixedSizeTypeNode',
                    'amount: numberTypeNode',
                ]);
            });

            it('should convert a legacy (pre-0.30) IDL at creation when given the program address', () => {
                // the one-step legacy route: the client converts internally (nodes-from-anchor handles
                // spec 00 too); legacy IDLs mostly declare no address, so the option supplies it
                const client = createIdlClient(loadNtt029Idl(), { programAddress: NTT_PROGRAM_ADDRESS });
                //    ^? IdlClient<CodamaIdl> — the legacy origin is invisible after creation

                const [, data] = client.decodeInstructionData(transferBurnIx);
                //        ^? data: unknown — a wide legacy IDL carries no literals to read
                expectTypeOf(data).toBeUnknown();
                expect(data).toMatchObject({ args: { amount: 42n, recipientChain: { id: 1 }, shouldQueue: false } });

                // the meta surface works off the converted root — legacy declares no discriminators,
                // the conversion derives them (sha256)
                expect(client.instructionName(transferBurnIx.data)).toBe('Transfer Burn');
            });
        });
    });
});

describe('README flows: schema-paired entries for unknown programs', () => {
    /** Case: a fetched codama root — getDecodedEntries flattens the decode into leaves, each paired with its schema node. */
    it('should flatten a codama decode into node-paired entries', () => {
        const tokenkeg = loadTokenkegIdl(); // wide CodamaIdl — no payload type exists anywhere
        const client = createIdlClient(tokenkeg);

        const decode = client.decodeInstruction(transferIx(tokenkeg));
        const entries = getDecodedEntries(decode);
        //    ^? DecodedEntry[] — { path, node, value } per leaf; a non-codama arm throws the typed kind-mismatch error

        // the path is the field's key — one row per leaf, nested fields flattened to dot paths
        expect(entries.map(joinPath)).toEqual(['discriminator', 'amount']);

        // or select leaves by what they ARE — no shape known upfront (e.g. every address in a payload)
        expect(entries.filter(({ node }) => node.kind === 'numberTypeNode')).toHaveLength(2);

        // the node says how to read the value: `transfer`'s amount is declared u64…
        const amount = findEntryOfKind(entries, 'amount', 'numberTypeNode');
        expect(amount?.node.format).toBe('u64'); // …typed straight off the narrowed node — no manual narrowing
        expect(amount?.value).toBe(42n); // …and the value already arrived in that format's runtime shape (bigint)
    });

    /** Case: an anchor JSON goes through the same call — the internal conversion pairs its leaves with codama nodes too. */
    it('should serve anchor-born programs with the same entries shape', () => {
        const simple = loadSimpleIdl(); // wide anchor JSON — converted internally by the engine
        const client = createIdlClient(simple);

        const decode = client.decodeInstruction(incrementIx(simple));
        const entries = getDecodedEntries(decode);
        //    ^? DecodedEntry[] — the same shape; the anchor origin is invisible

        // the same flattened keys — the anchor origin is invisible in the entries shape
        expect(entries.map(joinPath)).toEqual(['discriminator', 'amount']);

        // codama schema nodes even for the anchor-born program — one renderer serves both standards
        // (size wrappers are penetrated: the fixedSize(bytes) discriminator resolves to its bytes node)
        expect(findEntryOfKind(entries, 'discriminator', 'bytesTypeNode')).toBeDefined();

        // and the same leaf read as the codama case: anchor's u64 declaration survives the conversion…
        const amount = findEntryOfKind(entries, 'amount', 'numberTypeNode');
        expect(amount?.node.format).toBe('u64');
        expect(amount?.value).toBe(42n); // …so the value arrives in the same runtime shape (bigint)
    });

    /** Case: a whole consumer renderer — per-leaf formatting keyed by the entry's node kind, nothing else. */
    it('should drive a renderer from entry node kinds without claiming any payload type', () => {
        // the library owns the traversal (links, wrappers, options, nesting); the consumer owns only
        // the per-kind formatting — renderEntry above: a renderField loop with no typeof guessing anywhere
        const client = createIdlClient(exampleNativeTokenTransfersIdl);
        const bytes = encodeAccount(exampleNativeTokenTransfersIdl, 'config', {
            bump: 254,
            chainId: { id: 1 },
            custody: DEFAULT_ADDRESS,
            discriminator: base16('9b0caae01efacc82'),
            enabledTransceivers: { map: 1n },
            mint: DEFAULT_ADDRESS,
            mode: 'burning',
            nextTransceiverId: 1,
            owner: DEFAULT_ADDRESS,
            paused: false,
            pendingOwner: null,
            threshold: 1,
            tokenProgram: DEFAULT_ADDRESS,
        });

        const entries = getDecodedEntries(client.decodeAccount(bytes));
        //    ^? DecodedEntry[] — { path, node, value } per leaf; `node` drives the switch above
        const rendered = entries.map(entry => `${joinPath(entry)}: ${renderEntry(entry)}`);

        expect(rendered).toEqual([
            'discriminator: bytes(mwyq4B76zII=)',
            'bump: u8(254)',
            `owner: address(${DEFAULT_ADDRESS})`,
            'pendingOwner: none',
            `mint: address(${DEFAULT_ADDRESS})`,
            `tokenProgram: address(${DEFAULT_ADDRESS})`,
            'mode: burning', // decoded as index 1 — the enum node restored the variant name
            'chainId.id: u16(1)', // nested fields flatten into dot paths
            'nextTransceiverId: u8(1)',
            'threshold: u8(1)',
            'enabledTransceivers.map: u128(1)',
            'paused: no',
            `custody: address(${DEFAULT_ADDRESS})`,
        ]);
    });
});
