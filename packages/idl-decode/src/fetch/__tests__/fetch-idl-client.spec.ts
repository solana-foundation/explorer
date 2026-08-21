// The fetch route end to end against a mocked rpc: real account bytes on both legs — the anchor IDL
// account assembled per anchor's layout, the PMP metadata account encoded with the package's OWN
// encoder — so only the transport is faked.
import { deflateSync } from 'node:zlib';

import {
    Compression,
    DataSource,
    Encoding,
    findMetadataPda,
    Format,
    getBufferEncoder,
    getMetadataEncoder,
    PROGRAM_METADATA_PROGRAM_ADDRESS,
} from '@solana-program/program-metadata';
import { IDL_FALLBACK_PMP_AUTHORITIES } from '@solana/idl';
import {
    address,
    type Address,
    createAddressWithSeed,
    type GetAccountInfoApi,
    getProgramDerivedAddress,
    type Rpc,
    SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR,
    SolanaError,
} from '@solana/kit';
import { describe, expect, it, vi } from 'vitest';

import { gen } from '../../__tests__/gen.js';
import { codamaProvider } from '../../codama/index';
import {
    IDL_ERROR__IDL_ADDRESS_MISMATCH,
    IDL_ERROR__IDL_FETCH_FAILED,
    IDL_ERROR__IDL_NOT_FOUND,
    IDL_ERROR__IDL_PARSE_FAILED,
    IDL_ERROR__UNSUPPORTED_IDL_FORMAT,
    isIdlError,
} from '../../errors';
import {
    incrementIx,
    loadNtt029Idl,
    loadSimpleIdl,
    loadTokenkegIdl,
    NTT_PROGRAM_ADDRESS,
    ntt029TransferIx,
    transferIx,
    unwrapResult,
} from '../../__tests__/fixtures';

import {
    createLatestIdlFetcher,
    createOnChainIdlFetcher,
    fetchIdlClient,
    fetchLatestIdlClient,
    fetchOnChainIdlClient,
    IdlSource,
} from '../index';

const provider = codamaProvider();

/* eslint-disable @typescript-eslint/consistent-type-assertions -- the mocked rpc covers exactly the GetAccountInfoApi surface the fetch legs call */
function mockRpc(
    accounts: Record<string, Uint8Array>,
    onSend?: (config?: { abortSignal?: AbortSignal }) => void,
    // a buffer read is dispatched on the account's OWNER (PMP program vs anything else), so it has to be settable
    owners: Record<string, Address> = {},
): Rpc<GetAccountInfoApi> {
    return {
        getAccountInfo: (accountAddress: string) => ({
            send: async (config?: { abortSignal?: AbortSignal }) => {
                onSend?.(config);
                return {
                    context: { slot: 0n },
                    value: accounts[accountAddress]
                        ? {
                              data: [Buffer.from(accounts[accountAddress]).toString('base64'), 'base64'],
                              executable: false,
                              lamports: 1n,
                              owner: owners[accountAddress] ?? gen.systemProgram,
                              rentEpoch: 0n,
                              space: BigInt(accounts[accountAddress].length),
                          }
                        : null,
                };
            },
        }),
    } as unknown as Rpc<GetAccountInfoApi>;
}
/* eslint-enable @typescript-eslint/consistent-type-assertions */

/** The on-chain anchor IDL account: 8-byte discriminator + authority + u32 length + deflated JSON. */
function anchorIdlAccount(idl: object): Uint8Array {
    const deflated = deflateSync(Buffer.from(JSON.stringify(idl)));
    const data = Buffer.alloc(44 + deflated.length);
    data.writeUInt32LE(deflated.length, 40);
    deflated.copy(data, 44);
    return Uint8Array.from(data);
}

/** A PMP `idl` metadata account with direct, uncompressed content (a string stays raw); canonical unless an authority is given. */
function pmpIdlAccount(
    program: Address,
    idl: object | string,
    format: Format = Format.Json,
    authority: Address | null = null,
): Uint8Array {
    const data = new TextEncoder().encode(typeof idl === 'string' ? idl : JSON.stringify(idl));
    return Uint8Array.from(
        getMetadataEncoder().encode({
            authority,
            canonical: authority === null,
            compression: Compression.None,
            data,
            dataLength: data.length,
            dataSource: DataSource.Direct,
            encoding: Encoding.Utf8,
            format,
            mutable: true,
            program,
            seed: 'idl',
        }),
    );
}

/** A PMP `idl` metadata account whose payload claims zlib compression but carries garbage bytes. */
function pmpCorruptIdlAccount(program: Address): Uint8Array {
    const data = new TextEncoder().encode('not zlib');
    return Uint8Array.from(
        getMetadataEncoder().encode({
            authority: null,
            canonical: true,
            compression: Compression.Zlib,
            data,
            dataLength: data.length,
            dataSource: DataSource.Direct,
            encoding: Encoding.Utf8,
            format: Format.Json,
            mutable: true,
            program,
            seed: 'idl',
        }),
    );
}

/** A PMP `idl` metadata account whose payload lives behind a URL. */
function pmpUrlIdlAccount(program: Address, url: string): Uint8Array {
    const data = new TextEncoder().encode(url);
    return Uint8Array.from(
        getMetadataEncoder().encode({
            authority: null,
            canonical: true,
            compression: Compression.None,
            data,
            dataLength: data.length,
            dataSource: DataSource.Url,
            encoding: Encoding.Utf8,
            format: Format.Json,
            mutable: true,
            program,
            seed: 'idl',
        }),
    );
}

/** An anchor IDL account whose header is valid but whose deflated payload is not JSON. */
function anchorCorruptIdlAccount(): Uint8Array {
    const deflated = deflateSync(Buffer.from('not json'));
    const data = Buffer.alloc(44 + deflated.length);
    data.writeUInt32LE(deflated.length, 40);
    deflated.copy(data, 44);
    return Uint8Array.from(data);
}

async function anchorIdlAddress(program: Address): Promise<Address> {
    const [baseAddress] = await getProgramDerivedAddress({ programAddress: program, seeds: [] });
    return createAddressWithSeed({ baseAddress, programAddress: program, seed: 'anchor:idl' });
}

async function pmpIdlAddress(program: Address): Promise<Address> {
    const [metadataAddress] = await findMetadataPda({ authority: null, program, seed: 'idl' });
    return metadataAddress;
}

/** A PMP `Buffer` account — the staging account `write` fills before `setData` commits it. */
function pmpBufferAccount(program: Address, idl: object): Uint8Array {
    return Uint8Array.from(
        getBufferEncoder().encode({
            authority: null,
            canonical: true,
            data: new TextEncoder().encode(JSON.stringify(idl)),
            program,
            seed: 'idl',
        }),
    );
}

const FNDN_AUTHORITY = IDL_FALLBACK_PMP_AUTHORITIES[0];

/** The fndn fallback lookup — the PDA seeded with the Foundation's authority. */
async function pmpFallbackIdlAddress(program: Address): Promise<Address> {
    const [metadataAddress] = await findMetadataPda({ authority: FNDN_AUTHORITY, program, seed: 'idl' });
    return metadataAddress;
}

describe('fetchIdlClient', () => {
    it('should build a working client from a custom fetcher', async () => {
        const tokenkeg = loadTokenkegIdl();
        const client = unwrapResult(
            await fetchIdlClient(tokenkeg.program.publicKey, {
                fetcher: async () => JSON.parse(JSON.stringify(tokenkeg)) as unknown,
                provider,
            }),
        );

        const [, data] = client.decodeInstructionData<{ amount: bigint }>(transferIx(tokenkeg));
        expect(data).toMatchObject({ amount: 42n });
    });

    it('should take the leg options on the on-chain route', async () => {
        const simple = loadSimpleIdl();
        const program = address(simple.address);
        const rpc = mockRpc({ [await anchorIdlAddress(program)]: anchorIdlAccount(simple) });

        const [error] = await fetchIdlClient(program, { anchor: false, rpc });

        expect(isIdlError(error, IDL_ERROR__IDL_NOT_FOUND)).toBe(true);
    });

    it('should reject a malformed program address rather than report a fetch failure', async () => {
        // no lookup can be derived from it — a caller bug, not a data outcome
        await expect(fetchIdlClient('not-base58', { rpc: mockRpc({}) })).rejects.toThrow();
    });

    it('should not require a derivable address on the fetcher route', async () => {
        const tokenkeg = loadTokenkegIdl();
        const client = unwrapResult(
            await fetchIdlClient('not-base58', {
                fetcher: async () => JSON.parse(JSON.stringify(tokenkeg)) as unknown,
                provider,
                verifyAddress: false,
            }),
        );

        expect(client.programAddress()).toBe(tokenkeg.program.publicKey);
    });

    it('should build a client from a fetched legacy IDL using the requested address', async () => {
        // wormhole NTT publishes a legacy (0.29) IDL on its anchor PDA — the route supplies the
        // conversion address itself, so the caller never passes it twice
        const program = address(NTT_PROGRAM_ADDRESS);
        const rpc = mockRpc({ [await anchorIdlAddress(program)]: anchorIdlAccount(loadNtt029Idl()) });

        const client = unwrapResult(await fetchIdlClient(NTT_PROGRAM_ADDRESS, { provider, rpc }));

        expect(client.programAddress()).toBe(NTT_PROGRAM_ADDRESS);
        // names resolve off the converted root — legacy IDLs declare no discriminators
        expect(client.instructionName(ntt029TransferIx.data)).toBe('Transfer Burn');
    });

    it('should reject an IDL declaring a different program address', async () => {
        const tokenkeg = loadTokenkegIdl(); // declares TokenkegQfe… — not the requested program
        const [error, client] = await fetchIdlClient(gen.systemProgram, {
            fetcher: async () => JSON.parse(JSON.stringify(tokenkeg)) as unknown,
            provider,
        });

        expect(client).toBeUndefined();
        expect(isIdlError(error, IDL_ERROR__IDL_ADDRESS_MISMATCH)).toBe(true);
        expect(error?.context).toEqual({
            declaredAddress: tokenkeg.program.publicKey,
            programAddress: gen.systemProgram,
        });
    });

    it('should accept a mislabeled IDL when the address check is disabled', async () => {
        const tokenkeg = loadTokenkegIdl();
        const client = unwrapResult(
            await fetchIdlClient(gen.systemProgram, {
                fetcher: async () => JSON.parse(JSON.stringify(tokenkeg)) as unknown,
                provider,
                verifyAddress: false,
            }),
        );

        expect(client.programAddress()).toBe(tokenkeg.program.publicKey);
    });

    it('should surface a fetched value that is no IDL as the typed unsupported-format error', async () => {
        const [error, client] = await fetchIdlClient(gen.systemProgram, {
            fetcher: async () => ({ not: 'an idl' }),
            provider,
        });

        expect(client).toBeUndefined();
        expect(isIdlError(error, IDL_ERROR__UNSUPPORTED_IDL_FORMAT)).toBe(true);
    });

    it('should surface an absent IDL as the typed not-found error', async () => {
        const [error, client] = await fetchIdlClient(gen.systemProgram, {
            fetcher: async () => undefined,
            provider,
        });

        expect(client).toBeUndefined();
        expect(isIdlError(error, IDL_ERROR__IDL_NOT_FOUND)).toBe(true);
        expect(error?.context).toEqual({ programAddress: gen.systemProgram });
    });

    it('should surface a transport failure as the typed fetch error with its cause', async () => {
        const cause = new Error('rpc exploded');
        const [error] = await fetchIdlClient(gen.systemProgram, {
            fetcher: async () => {
                throw cause;
            },
            provider,
        });

        expect(isIdlError(error, IDL_ERROR__IDL_FETCH_FAILED)).toBe(true);
        expect(error?.cause).toBe(cause);
    });

    it('should reject with the abort reason instead of returning an error value', async () => {
        await expect(
            fetchIdlClient(gen.systemProgram, {
                abortSignal: AbortSignal.abort(),
                fetcher: async () => loadTokenkegIdl(),
                provider,
            }),
        ).rejects.toThrow(/abort/i);
    });

    it('should reject with the abort reason when the abort lands mid-fetch', async () => {
        const controller = new AbortController();
        const reason = new Error('caller cancelled');
        const pending = fetchIdlClient(gen.systemProgram, {
            abortSignal: controller.signal,
            // a transport that wraps the abort in its own rejection — the reason must still win
            fetcher: (_programAddress, config) =>
                new Promise((_resolve, reject) => {
                    config?.abortSignal?.addEventListener('abort', () => reject(new Error('transport wrapper')));
                }),
            provider,
        });

        controller.abort(reason);

        await expect(pending).rejects.toBe(reason);
    });

    it('should pass the signal through to the fetcher', async () => {
        const controller = new AbortController();
        let receivedSignal: AbortSignal | undefined;
        await fetchIdlClient(gen.systemProgram, {
            abortSignal: controller.signal,
            fetcher: async (_programAddress, config) => {
                receivedSignal = config?.abortSignal;
                return loadTokenkegIdl();
            },
            provider,
        });

        expect(receivedSignal).toBe(controller.signal);
    });
});

// The resolution policy itself, driven through whichever surface reaches it — `fetchIdlClient` for the
// default route, `createOnChainIdlFetcher` where the raw fetcher's own contract is what matters.
describe('on-chain resolution', () => {
    it('should resolve the PMP idl metadata first', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        const rpc = mockRpc({ [await pmpIdlAddress(program)]: pmpIdlAccount(program, tokenkeg) });

        // no provider passed — the codama engine is the default
        const client = unwrapResult(await fetchIdlClient(program, { rpc }));

        const [, data] = client.decodeInstructionData<{ amount: bigint }>(transferIx(tokenkeg));
        expect(data).toMatchObject({ amount: 42n });
    });

    it('should resolve the PMP idl metadata under the fndn fallback authority', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        // only the fallback PDA holds the idl; the canonical one is absent
        const rpc = mockRpc({
            [await pmpFallbackIdlAddress(program)]: pmpIdlAccount(program, tokenkeg, Format.Json, FNDN_AUTHORITY),
        });

        const client = unwrapResult(await fetchIdlClient(program, { rpc }));

        const [, data] = client.decodeInstructionData<{ amount: bigint }>(transferIx(tokenkeg));
        expect(data).toMatchObject({ amount: 42n });
    });

    it('should fall back to the anchor idl account when PMP has none', async () => {
        const simple = loadSimpleIdl();
        const program = address(simple.address);
        const rpc = mockRpc({ [await anchorIdlAddress(program)]: anchorIdlAccount(simple) });

        const client = unwrapResult(await fetchIdlClient(program, { rpc }));

        const [, data] = client.decodeInstructionData<{ amount: bigint }>(incrementIx(simple));
        expect(data).toMatchObject({ amount: 42n });
    });

    it('should skip the anchor leg when disabled', async () => {
        const simple = loadSimpleIdl();
        const program = address(simple.address);
        const rpc = mockRpc({ [await anchorIdlAddress(program)]: anchorIdlAccount(simple) });
        const fetcher = createOnChainIdlFetcher(rpc, { anchor: false });

        const [error] = await fetchIdlClient(program, { fetcher });

        expect(isIdlError(error, IDL_ERROR__IDL_NOT_FOUND)).toBe(true);
    });

    it('should resolve undefined when neither source has an IDL', async () => {
        const fetcher = createOnChainIdlFetcher(mockRpc({}));

        await expect(fetcher(gen.systemProgram)).resolves.toBeUndefined();
    });

    it('should surface a metadata account that is no PMP container as the typed parse error', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        // bytes that do not decode as PMP metadata at all — upstream's `framing`, a fact about the account
        const rpc = mockRpc({ [await pmpIdlAddress(program)]: Uint8Array.from([1, 2, 3]) });

        const [error, client] = await fetchIdlClient(program, { rpc });

        expect(client).toBeUndefined();
        expect(isIdlError(error, IDL_ERROR__IDL_PARSE_FAILED)).toBe(true);
        expect(error?.context).toMatchObject({ operation: 'pmp idl data' });
    });

    it('should surface a corrupt direct PMP payload as the typed fetch error', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        // the metadata decodes fine, but its zlib-claimed payload is garbage
        const rpc = mockRpc({ [await pmpIdlAddress(program)]: pmpCorruptIdlAccount(program) });

        const [error, client] = await fetchIdlClient(program, { rpc });

        expect(client).toBeUndefined();
        // upstream's `payload` covers a failed read/download too, so it cannot be asserted as a data verdict
        expect(isIdlError(error, IDL_ERROR__IDL_FETCH_FAILED)).toBe(true);
        expect(error?.cause).toBeDefined();
    });

    it('should surface a url-sourced PMP payload failure as the typed fetch error', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        const rpc = mockRpc({ [await pmpIdlAddress(program)]: pmpUrlIdlAccount(program, 'https://idl.invalid/x') });
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.reject(new Error('network down'))),
        );
        try {
            const [error, client] = await fetchIdlClient(program, { rpc });

            expect(client).toBeUndefined();
            // the download upstream owns is unreachable — a blip, not a program that publishes bad bytes
            expect(isIdlError(error, IDL_ERROR__IDL_FETCH_FAILED)).toBe(true);
        } finally {
            vi.unstubAllGlobals();
        }
    });

    it('should thread the abort signal into the rpc reads of both legs', async () => {
        const seen: (AbortSignal | undefined)[] = [];
        const simple = loadSimpleIdl();
        const program = address(simple.address);
        // PMP metadata is absent (first send) and the anchor account resolves (second send)
        const rpc = mockRpc({ [await anchorIdlAddress(program)]: anchorIdlAccount(simple) }, config =>
            seen.push(config?.abortSignal),
        );
        const controller = new AbortController();

        await createOnChainIdlFetcher(rpc)(program, { abortSignal: controller.signal });

        expect(seen.length).toBeGreaterThanOrEqual(2);
        for (const signal of seen) expect(signal).toBe(controller.signal);
    });

    it('should read the PMP idl metadata under a non-canonical authority', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        const authority = address(NTT_PROGRAM_ADDRESS); // any address distinct from the canonical (null) authority
        const [metadataAddress] = await findMetadataPda({ authority, program, seed: 'idl' });
        const rpc = mockRpc({ [metadataAddress]: pmpIdlAccount(program, tokenkeg, Format.Json, authority) });
        const fetcher = createOnChainIdlFetcher(rpc, { authority });

        // the canonical PDA holds nothing — resolution only succeeds if the option reached the seeds
        await expect(fetcher(program)).resolves.toMatchObject({ program: { publicKey: program } });
    });

    it('should surface a corrupt anchor idl account as the typed parse error', async () => {
        const simple = loadSimpleIdl();
        const program = address(simple.address);
        // valid layout, but the deflated payload inflates to something that is not JSON
        const rpc = mockRpc({ [await anchorIdlAddress(program)]: anchorCorruptIdlAccount() });

        const [error, client] = await fetchIdlClient(program, { rpc });

        expect(client).toBeUndefined();
        expect(isIdlError(error, IDL_ERROR__IDL_PARSE_FAILED)).toBe(true);
    });

    it('should resolve PMP idl content whatever format the metadata declares', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        // the declared format is advisory — JSON-parseability of the content is what decides
        const rpc = mockRpc({ [await pmpIdlAddress(program)]: pmpIdlAccount(program, tokenkeg, Format.Toml) });

        const client = unwrapResult(await fetchIdlClient(program, { rpc }));

        expect(client.programAddress()).toBe(tokenkeg.program.publicKey);
    });

    it('should surface unparseable PMP idl content as the typed parse error', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        const rpc = mockRpc({ [await pmpIdlAddress(program)]: pmpIdlAccount(program, 'not json') });

        const [error, client] = await fetchIdlClient(program, { rpc });

        expect(client).toBeUndefined();
        expect(isIdlError(error, IDL_ERROR__IDL_PARSE_FAILED)).toBe(true);
    });

    it('should not fall through to the anchor leg when the PMP metadata is corrupt', async () => {
        const simple = loadSimpleIdl();
        const program = address(simple.address);
        const rpc = mockRpc({
            [await anchorIdlAddress(program)]: anchorIdlAccount(simple), // a valid fallback that must NOT mask the corruption
            [await pmpIdlAddress(program)]: pmpCorruptIdlAccount(program),
        });

        const [error, client] = await fetchIdlClient(program, { rpc });

        expect(client).toBeUndefined();
        expect(isIdlError(error, IDL_ERROR__IDL_FETCH_FAILED)).toBe(true);
    });
});

describe('fetchOnChainIdlClient', () => {
    it('should keep the pre-rename names resolving to the same functions', () => {
        // nothing in the repo reads these; the aliases exist for callers that learned the old names
        expect(fetchLatestIdlClient).toBe(fetchOnChainIdlClient);
        expect(createLatestIdlFetcher).toBe(createOnChainIdlFetcher);
    });

    it('should attribute a PMP hit as the pmp source with a working client', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        const rpc = mockRpc({ [await pmpIdlAddress(program)]: pmpIdlAccount(program, tokenkeg) });

        const { client, source } = unwrapResult(await fetchOnChainIdlClient(program, { rpc }));

        expect(source).toBe(IdlSource.Pmp);
        const [, data] = client.decodeInstructionData<{ amount: bigint }>(transferIx(tokenkeg));
        expect(data).toMatchObject({ amount: 42n });
    });

    it('should attribute the fndn fallback authority that served the IDL', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        const rpc = mockRpc({
            [await pmpFallbackIdlAddress(program)]: pmpIdlAccount(program, tokenkeg, Format.Json, FNDN_AUTHORITY),
        });

        const { authority, source } = unwrapResult(await fetchOnChainIdlClient(program, { rpc }));

        expect(source).toBe(IdlSource.Pmp);
        expect(authority).toBe(FNDN_AUTHORITY);
    });

    it('should attribute the canonical authority when it holds the IDL', async () => {
        const tokenkeg = loadTokenkegIdl();
        const simple = loadSimpleIdl();
        const program = address(tokenkeg.program.publicKey);
        const rpc = mockRpc({
            [await pmpFallbackIdlAddress(program)]: pmpIdlAccount(program, simple, Format.Json, FNDN_AUTHORITY),
            [await pmpIdlAddress(program)]: pmpIdlAccount(program, tokenkeg),
        });

        const { authority } = unwrapResult(await fetchOnChainIdlClient(program, { rpc }));

        expect(authority).toBeNull();
    });

    it('should skip the fndn fallback lookup when an authority is pinned', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        const rpc = mockRpc({
            [await pmpFallbackIdlAddress(program)]: pmpIdlAccount(program, tokenkeg, Format.Json, FNDN_AUTHORITY),
        });

        const [error] = await fetchOnChainIdlClient(program, { anchor: false, authority: null, rpc });

        expect(isIdlError(error, IDL_ERROR__IDL_NOT_FOUND)).toBe(true);
    });

    it('should report no authority off the anchor leg', async () => {
        const simple = loadSimpleIdl();
        const program = address(simple.address);
        const rpc = mockRpc({ [await anchorIdlAddress(program)]: anchorIdlAccount(simple) });

        const fetched = unwrapResult(await fetchOnChainIdlClient(program, { rpc }));

        expect('authority' in fetched).toBe(false);
    });

    it('should attribute the anchor fallback as the anchor-pda source', async () => {
        const simple = loadSimpleIdl();
        const program = address(simple.address);
        const rpc = mockRpc({ [await anchorIdlAddress(program)]: anchorIdlAccount(simple) });

        const { client, source } = unwrapResult(await fetchOnChainIdlClient(program, { rpc }));

        expect(source).toBe(IdlSource.Anchor);
        const [, data] = client.decodeInstructionData<{ amount: bigint }>(incrementIx(simple));
        expect(data).toMatchObject({ amount: 42n });
    });

    it('should surface an absent IDL on both legs as the typed not-found error', async () => {
        const [error, fetched] = await fetchOnChainIdlClient(gen.systemProgram, {
            rpc: mockRpc({}),
        });

        expect(fetched).toBeUndefined();
        expect(isIdlError(error, IDL_ERROR__IDL_NOT_FOUND)).toBe(true);
    });

    it('should skip the anchor leg when disabled', async () => {
        const simple = loadSimpleIdl();
        const program = address(simple.address);
        const rpc = mockRpc({ [await anchorIdlAddress(program)]: anchorIdlAccount(simple) });

        const [error, fetched] = await fetchOnChainIdlClient(program, { anchor: false, rpc });

        expect(fetched).toBeUndefined();
        expect(isIdlError(error, IDL_ERROR__IDL_NOT_FOUND)).toBe(true);
    });

    it('should not mask a corrupt PMP leg with the anchor fallback', async () => {
        const simple = loadSimpleIdl();
        const program = address(simple.address);
        const rpc = mockRpc({
            [await anchorIdlAddress(program)]: anchorIdlAccount(simple),
            [await pmpIdlAddress(program)]: pmpCorruptIdlAccount(program),
        });

        const [error, fetched] = await fetchOnChainIdlClient(program, { rpc });

        expect(fetched).toBeUndefined();
        expect(isIdlError(error, IDL_ERROR__IDL_FETCH_FAILED)).toBe(true);
    });

    it('should surface a transport failure as the typed fetch error with its cause', async () => {
        // a real rpc reports transport failures as SolanaErrors — that is what keeps a blip retryable
        const cause = new SolanaError(SOLANA_ERROR__RPC__TRANSPORT_HTTP_ERROR, {
            headers: new Headers(),
            message: 'Bad Gateway',
            statusCode: 502,
        });
        const [error] = await fetchOnChainIdlClient(gen.systemProgram, {
            rpc: mockRpc({}, () => {
                throw cause;
            }),
        });

        expect(isIdlError(error, IDL_ERROR__IDL_FETCH_FAILED)).toBe(true);
        expect(error?.cause).toBe(cause);
    });

    it('should surface a non-SolanaError rpc failure as the typed fetch error with its cause', async () => {
        // @solana/idl files any non-SolanaError throw under `payload`; an unreachable rpc must stay retryable
        const cause = new Error('rpc exploded');
        const [error] = await fetchOnChainIdlClient(gen.systemProgram, {
            rpc: mockRpc({}, () => {
                throw cause;
            }),
        });

        expect(isIdlError(error, IDL_ERROR__IDL_FETCH_FAILED)).toBe(true);
        expect(error?.cause).toBe(cause);
    });

    it('should reject an IDL declaring a different program address', async () => {
        const tokenkeg = loadTokenkegIdl(); // declares TokenkegQfe… — not the requested program
        const requested = address(gen.systemProgram);
        const rpc = mockRpc({ [await pmpIdlAddress(requested)]: pmpIdlAccount(requested, tokenkeg) });

        const [error, fetched] = await fetchOnChainIdlClient(requested, { rpc });

        expect(fetched).toBeUndefined();
        expect(isIdlError(error, IDL_ERROR__IDL_ADDRESS_MISMATCH)).toBe(true);
    });

    it('should accept a mislabeled IDL when the address check is disabled', async () => {
        const tokenkeg = loadTokenkegIdl();
        const requested = address(gen.systemProgram);
        const rpc = mockRpc({ [await pmpIdlAddress(requested)]: pmpIdlAccount(requested, tokenkeg) });

        const { client, source } = unwrapResult(await fetchOnChainIdlClient(requested, { rpc, verifyAddress: false }));

        expect(source).toBe(IdlSource.Pmp);
        expect(client.programAddress()).toBe(tokenkeg.program.publicKey);
    });

    it('should surface a fetched value that is no IDL as the typed unsupported-format error', async () => {
        const requested = address(gen.systemProgram);
        const rpc = mockRpc({ [await pmpIdlAddress(requested)]: pmpIdlAccount(requested, { not: 'an idl' }) });

        const [error, fetched] = await fetchOnChainIdlClient(requested, { rpc });

        expect(fetched).toBeUndefined();
        expect(isIdlError(error, IDL_ERROR__UNSUPPORTED_IDL_FORMAT)).toBe(true);
    });

    it('should reject with the abort reason instead of returning an error value', async () => {
        await expect(
            fetchOnChainIdlClient(gen.systemProgram, {
                abortSignal: AbortSignal.abort(),
                rpc: mockRpc({}),
            }),
        ).rejects.toThrow(/abort/i);
    });

    it('should reject with the abort reason when the abort lands mid-fetch', async () => {
        const controller = new AbortController();
        const reason = new Error('caller cancelled');
        const rpc = mockRpc({}, () => {
            // a transport that wraps the abort in its own rejection — the reason must still win
            controller.abort(reason);
            throw new Error('transport wrapper');
        });

        await expect(fetchOnChainIdlClient(gen.systemProgram, { abortSignal: controller.signal, rpc })).rejects.toBe(
            reason,
        );
    });
});

// `buffer` reads one named account instead of deriving anything — a staged IDL, either family. The
// family comes off the account's owner, so `source` stays the publication vocabulary.
describe('buffer resolution', () => {
    it('should decode an anchor idl buffer as the anchor source', async () => {
        const simple = loadSimpleIdl();
        const program = address(simple.address);
        const buffer = address(gen.systemProgram);
        const rpc = mockRpc({ [buffer]: anchorIdlAccount(simple) });

        const fetched = unwrapResult(await fetchOnChainIdlClient(program, { buffer, rpc }));

        expect(fetched.source).toBe(IdlSource.Anchor);
        expect(fetched.address).toBe(buffer);
        const [, data] = fetched.client.decodeInstructionData<{ amount: bigint }>(incrementIx(simple));
        expect(data).toMatchObject({ amount: 42n });
    });

    it('should decode a pmp idl buffer as the pmp source', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        const buffer = address(gen.systemProgram);
        const rpc = mockRpc({ [buffer]: pmpBufferAccount(program, tokenkeg) }, undefined, {
            [buffer]: PROGRAM_METADATA_PROGRAM_ADDRESS,
        });

        const fetched = unwrapResult(await fetchOnChainIdlClient(program, { buffer, rpc }));

        expect(fetched.source).toBe(IdlSource.Pmp);
        expect(fetched.authority).toBeUndefined(); // a buffer carries no resolution authority
        const [, data] = fetched.client.decodeInstructionData<{ amount: bigint }>(transferIx(tokenkeg));
        expect(data).toMatchObject({ amount: 42n });
    });

    it('should derive nothing when a buffer is named', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        const buffer = address(NTT_PROGRAM_ADDRESS);
        // the canonical PMP PDA holds a valid IDL that must NOT be consulted
        const rpc = mockRpc({ [await pmpIdlAddress(program)]: pmpIdlAccount(program, tokenkeg) });

        const [error] = await fetchOnChainIdlClient(program, { buffer, rpc });

        expect(isIdlError(error, IDL_ERROR__IDL_NOT_FOUND)).toBe(true);
    });

    it('should surface buffer content that is no JSON as the typed parse error', async () => {
        const simple = loadSimpleIdl();
        const buffer = address(gen.systemProgram);
        // a valid IdlAccount header whose payload inflates — to something that is not JSON
        const rpc = mockRpc({ [buffer]: anchorCorruptIdlAccount() });

        const [error] = await fetchOnChainIdlClient(address(simple.address), { buffer, rpc });

        expect(isIdlError(error, IDL_ERROR__IDL_PARSE_FAILED)).toBe(true);
        expect(error?.context).toMatchObject({ operation: 'anchor idl content' });
    });

    it('should surface undecodable buffer bytes as the typed parse error', async () => {
        const simple = loadSimpleIdl();
        const buffer = address(gen.systemProgram);
        // shorter than the IdlAccount header, and not PMP-owned — neither family can frame it
        const rpc = mockRpc({ [buffer]: new Uint8Array(16) });

        const [error] = await fetchOnChainIdlClient(address(simple.address), { buffer, rpc });

        expect(isIdlError(error, IDL_ERROR__IDL_PARSE_FAILED)).toBe(true);
        // the label names the publication, not the account read — a buffer failure is indistinguishable here
        expect(error?.context).toMatchObject({ operation: 'anchor idl data' });
    });

    it('should reject a buffer IDL declaring a different program address', async () => {
        const tokenkeg = loadTokenkegIdl(); // declares TokenkegQfe… — not the requested program
        const buffer = address(NTT_PROGRAM_ADDRESS);
        const rpc = mockRpc({ [buffer]: pmpBufferAccount(address(gen.systemProgram), tokenkeg) }, undefined, {
            [buffer]: PROGRAM_METADATA_PROGRAM_ADDRESS,
        });

        const [error] = await fetchOnChainIdlClient(gen.systemProgram, { buffer, rpc });

        expect(isIdlError(error, IDL_ERROR__IDL_ADDRESS_MISMATCH)).toBe(true);
    });

    it('should attribute the derived PDA address when no buffer is named', async () => {
        const tokenkeg = loadTokenkegIdl();
        const program = address(tokenkeg.program.publicKey);
        const pda = await pmpIdlAddress(program);
        const rpc = mockRpc({ [pda]: pmpIdlAccount(program, tokenkeg) });

        const fetched = unwrapResult(await fetchOnChainIdlClient(program, { rpc }));

        expect(fetched.address).toBe(pda);
    });
});
