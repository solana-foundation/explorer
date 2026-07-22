import { address } from '@solana/kit';
import { describe, expect, it, vi } from 'vitest';

import {
    createIdlClient,
    createIdlMetaClient,
    type IdlMetaClient,
    isAnchorStandard,
    isCodamaStandard,
    tryCreateIdlClient,
    tryCreateIdlMetaClient,
} from '../client';
import {
    IDL_ERROR__ACCOUNT_DECODE_FAILED,
    IDL_ERROR__DECODE_KIND_MISMATCH,
    IDL_ERROR__IDL_ADDRESS_MISMATCH,
    IDL_ERROR__IDL_PARSE_FAILED,
    IDL_ERROR__INSTRUCTION_DECODE_FAILED,
    IDL_ERROR__MISSING_DECODE_HANDLER,
    IDL_ERROR__UNSUPPORTED_IDL_FORMAT,
    IdlError,
} from '../errors';
import {
    type AnchorIdl,
    type CodamaIdl,
    type IdlDecodeProvider,
    IdlStandard,
    type InstructionHandlers,
    type SupportedIdl,
    unknownArm,
} from '../types';
import { incrementIx, loadSimpleIdl, loadTokenkegIdl, transferIx, undeclaredInstructionData } from './fixtures';

// passes isAnchorIdl (address + metadata.spec + instructions) but rootNodeFromAnchor rejects the arg type
const brokenAnchorIdl = () =>
    ({
        address: '11111111111111111111111111111111',
        instructions: [{ accounts: [], args: [{ name: 'x', type: 'not-a-type' }], discriminator: [9], name: 'boom' }],
        metadata: { name: 'broken', spec: '0.1.0', version: '0.0.1' },
    }) as unknown as AnchorIdl;

const brokenIx = () => ({
    accounts: [],
    data: Uint8Array.from([9, 1]),
    programAddress: address('11111111111111111111111111111111'),
});

const missAccountData = () => Uint8Array.from([1, 2, 3]);

describe('createIdlMetaClient (names and metadata only)', () => {
    it('should expose program metadata for an Anchor IDL', () => {
        const simple = loadSimpleIdl();
        const client = createIdlMetaClient(simple);
        expect(client.programAddress()).toBe(simple.address);
        expect(client.programName()).toBe('Simple');
        expect(client.instructionName(incrementIx(simple).data)).toBe('Increment');
    });

    it('should expose program metadata for a Codama IDL', () => {
        const tokenkeg = loadTokenkegIdl();
        const client = createIdlMetaClient(tokenkeg);
        expect(client.programAddress()).toBe(tokenkeg.program.publicKey);
        expect(client.programName()).toBe('Token');
        expect(client.instructionName(transferIx(tokenkeg).data)).toBe('Transfer');
    });

    it('should not carry decode methods', () => {
        const client = createIdlMetaClient(loadSimpleIdl());
        expect('decodeInstruction' in client).toBe(false);
        expect('decodeAccount' in client).toBe(false);
        expect('decodeInstructionData' in client).toBe(false);
        expect('decodeAccountData' in client).toBe(false);
    });

    it('should throw the unsupported-format error when a lying type sneaks past detection', () => {
        expect(() => createIdlMetaClient({} as SupportedIdl)).toThrowError(
            expect.objectContaining({ code: IDL_ERROR__UNSUPPORTED_IDL_FORMAT }),
        );
    });
});

describe('createIdlClient (default codama engine)', () => {
    it('should throw the unsupported-format error when a lying type sneaks past detection', () => {
        expect(() => createIdlClient({} as SupportedIdl)).toThrowError(
            expect.objectContaining({ code: IDL_ERROR__UNSUPPORTED_IDL_FORMAT }),
        );
    });

    it('should decode a Codama instruction into the codama arm', () => {
        const tokenkeg = loadTokenkegIdl();
        const decode = createIdlClient(tokenkeg).decodeInstruction(transferIx(tokenkeg));
        expect(decode.kind).toBe(IdlStandard.Codama);
    });

    it('should decode an Anchor instruction through the conversion route into the codama arm', () => {
        const simple = loadSimpleIdl();
        const decode = createIdlClient(simple).decodeInstruction(incrementIx(simple));
        expect(decode.kind).toBe(IdlStandard.Codama);
    });

    it('should dispatch a decode through the handler map', () => {
        const tokenkeg = loadTokenkegIdl();
        const result = createIdlClient(tokenkeg).decodeInstruction(transferIx(tokenkeg), {
            codama: () => 'decoded' as const,
            unknown: () => 'failed' as const,
        });
        expect(result).toBe('decoded');
    });

    it('should degrade unmatched instruction data to the unknown arm', () => {
        const tokenkeg = loadTokenkegIdl();
        const decode = createIdlClient(tokenkeg).decodeInstruction({
            ...transferIx(tokenkeg),
            data: Uint8Array.from([99, 1, 2]),
        });
        expect(decode.kind).toBe('unknown');
    });

    it('should fail loud when the IDL program does not match the instruction program', () => {
        const simple = loadSimpleIdl();
        const client = createIdlClient(simple);
        expect(() =>
            client.decodeInstruction({
                ...incrementIx(simple),
                programAddress: transferIx(loadTokenkegIdl()).programAddress,
            }),
        ).toThrowError(expect.objectContaining({ code: IDL_ERROR__IDL_ADDRESS_MISMATCH }));
    });

    it('should degrade unmatched account data to the unknown arm', () => {
        const decode = createIdlClient(loadSimpleIdl()).decodeAccount(Uint8Array.from([1, 2, 3]));
        expect(decode.kind).toBe('unknown');
    });

    it('should dispatch an account decode through the handler map', () => {
        const result = createIdlClient(loadSimpleIdl()).decodeAccount(Uint8Array.from([1, 2, 3]), {
            anchor: () => 'rescued' as const,
            codama: () => 'decoded' as const,
            unknown: () => 'miss' as const,
        });
        expect(result).toBe('miss');
    });
});

describe('tryCreateIdlClient', () => {
    it('should return an error-first tuple for unsupported input', () => {
        const [error, client] = tryCreateIdlClient({ not: 'an idl' });
        expect(client).toBeUndefined();
        expect(error).toBeInstanceOf(IdlError);
        expect(error?.code).toBe(IDL_ERROR__UNSUPPORTED_IDL_FORMAT);
    });

    it('should return the client in the value slot for supported input', () => {
        const [error, client] = tryCreateIdlClient(loadTokenkegIdl() as unknown);
        expect(error).toBeUndefined();
        expect(client?.programName()).toBe('Token');
    });

    it('should decode with the default engine', () => {
        const tokenkeg = loadTokenkegIdl();
        const [error, client] = tryCreateIdlClient(tokenkeg as unknown);
        expect(error).toBeUndefined();
        expect(client?.decodeInstruction(transferIx(tokenkeg)).kind).toBe(IdlStandard.Codama);
    });

    it('should tolerate guard-passing roots whose members lie about the declared shape', () => {
        // detection is shallow by design — creation skips lying members instead of crashing
        const corrupt: unknown = {
            kind: 'rootNode',
            program: {
                accounts: [],
                definedTypes: [],
                // a nameless instruction whose field discriminator points at absent arguments
                instructions: [{ discriminators: [{ kind: 'fieldDiscriminatorNode', name: 'd', offset: 0 }] }],
                name: 'corrupt',
                publicKey: '11111111111111111111111111111111',
                version: '0.0.0',
            },
        };
        const [error, client] = tryCreateIdlClient(corrupt);
        expect(error).toBeUndefined();
        expect(client?.instructionName(Uint8Array.from([1]))).toBeUndefined();
        // decode failures stay values on the unknown arm — never a crash
        expect(client?.decodeInstruction(brokenIx()).kind).toBe('unknown');
    });

    it('should fold a creation crash into the typed parse error instead of throwing', () => {
        // the safety net for lies deeper than the member guards — simulated with a throwing accessor
        const trap: unknown = {
            kind: 'rootNode',
            program: {
                get instructions(): never {
                    throw new Error('deep corruption');
                },
                publicKey: '11111111111111111111111111111111',
            },
        };
        const [error, client] = tryCreateIdlClient(trap);
        expect(client).toBeUndefined();
        expect(error?.code).toBe(IDL_ERROR__IDL_PARSE_FAILED);
        expect(error?.cause).toMatchObject({ message: 'deep corruption' });
    });
});

describe('tryCreateIdlMetaClient', () => {
    it('should return an error-first tuple for unsupported input', () => {
        const [error, client] = tryCreateIdlMetaClient({ not: 'an idl' });
        expect(client).toBeUndefined();
        expect(error?.code).toBe(IDL_ERROR__UNSUPPORTED_IDL_FORMAT);
    });

    it('should return the metadata client in the value slot for supported input', () => {
        const [error, client] = tryCreateIdlMetaClient(loadTokenkegIdl() as unknown);
        expect(error).toBeUndefined();
        expect(client?.programName()).toBe('Token');
        expect(client === undefined || 'decodeInstruction' in client).toBe(false);
    });
});

describe('handler-map dispatch guard', () => {
    it('should dispatch an anchor decode through the handler map', () => {
        const simple = loadSimpleIdl();
        const missIx = { ...incrementIx(simple), data: undeclaredInstructionData() };
        const result = createIdlClient(simple, {
            fallbackDecoder: { decodeInstruction: () => ({ name: 'increment' }) },
        }).decodeInstruction(missIx, {
            anchor: () => 'rescued' as const,
            codama: () => 'decoded' as const,
            unknown: () => 'failed' as const,
        });
        expect(result).toBe('rescued');
    });

    it('should throw MISSING_DECODE_HANDLER when a widened handler map misses the arm', () => {
        const tokenkeg = loadTokenkegIdl();
        // the types enforce totality — widen the map to pin the runtime guard behind them
        const handlers = { unknown: () => 'failed' } as unknown as InstructionHandlers<CodamaIdl, string>;
        expect(() => createIdlClient(tokenkeg).decodeInstruction(transferIx(tokenkeg), handlers)).toThrowError(
            expect.objectContaining({ code: IDL_ERROR__MISSING_DECODE_HANDLER }),
        );
    });
});

describe('fallbackDecoder escape hatch (instructions)', () => {
    it('should pass the anchor document and the instruction to the injected decoder', () => {
        const simple = loadSimpleIdl();
        const decodeInstruction = vi.fn(() => undefined);
        const missIx = { ...incrementIx(simple), data: undeclaredInstructionData() };
        createIdlClient(simple, {
            fallbackDecoder: { decodeInstruction },
        }).decodeInstruction(missIx);
        expect(decodeInstruction).toHaveBeenCalledExactlyOnceWith(simple, missIx);
    });

    it('should never call the injected decoder for a Codama document', () => {
        const tokenkeg = loadTokenkegIdl();
        const decodeInstruction = vi.fn(() => undefined);
        createIdlClient(tokenkeg, {
            fallbackDecoder: { decodeInstruction },
        }).decodeInstruction({
            ...transferIx(tokenkeg),
            data: Uint8Array.from([99, 1, 2]),
        });
        expect(decodeInstruction).not.toHaveBeenCalled();
    });

    it('should land on the anchor arm when the decoder rescues a converted-but-unmatched instruction', () => {
        const simple = loadSimpleIdl();
        const missIx = { ...incrementIx(simple), data: undeclaredInstructionData() };
        const decode = createIdlClient(simple, {
            fallbackDecoder: { decodeInstruction: () => ({ name: 'increment' }) },
        }).decodeInstruction(missIx);
        if (decode.kind !== IdlStandard.Anchor) throw new Error('expected the anchor arm');
        expect(decode.decoded).toEqual({ name: 'increment' });
        // conversion succeeded, so no bypassed pipeline errors ride along
        expect(decode.recoveredFrom).toBeUndefined();
    });

    it('should return the decoded payload from the anchor arm', () => {
        const simple = loadSimpleIdl();
        const missIx = { ...incrementIx(simple), data: undeclaredInstructionData() };
        const client = createIdlClient(simple, {
            fallbackDecoder: { decodeInstruction: () => ({ name: 'increment' }) },
        });
        const decode = client.decodeInstruction(missIx);
        if (decode.kind !== IdlStandard.Anchor) throw new Error('expected the anchor arm');
        expect(client.getDecodedData(decode)).toEqual({ name: 'increment' });
    });

    it('should fall to the unknown arm when the decoder returns undefined', () => {
        const simple = loadSimpleIdl();
        const missIx = { ...incrementIx(simple), data: undeclaredInstructionData() };
        const decode = createIdlClient(simple, {
            fallbackDecoder: { decodeInstruction: () => undefined },
        }).decodeInstruction(missIx);
        expect(decode.kind).toBe('unknown');
    });

    it('should fold a throwing decoder into the unknown arm instead of escaping', () => {
        const simple = loadSimpleIdl();
        const missIx = { ...incrementIx(simple), data: undeclaredInstructionData() };
        const decode = createIdlClient(simple, {
            fallbackDecoder: {
                decodeInstruction: () => {
                    throw new Error('decoder boom');
                },
            },
        }).decodeInstruction(missIx);
        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors.map(e => e.code)).toEqual([IDL_ERROR__INSTRUCTION_DECODE_FAILED]);
    });

    it('should return undefined for the unknown arm payload', () => {
        const simple = loadSimpleIdl();
        const missIx = { ...incrementIx(simple), data: undeclaredInstructionData() };
        const client = createIdlClient(simple, {
            fallbackDecoder: { decodeInstruction: () => undefined },
        });
        expect(client.getDecodedData(client.decodeInstruction(missIx))).toBeUndefined();
    });
});

describe('fallbackDecoder escape hatch (accounts)', () => {
    it('should pass the anchor document and the raw data to the injected decoder', () => {
        const simple = loadSimpleIdl();
        const decodeAccount = vi.fn(() => undefined);
        const data = missAccountData();
        createIdlClient(simple, { fallbackDecoder: { decodeAccount } }).decodeAccount(data);
        expect(decodeAccount).toHaveBeenCalledExactlyOnceWith(simple, data);
    });

    it('should never call the injected decoder for a Codama document', () => {
        const decodeAccount = vi.fn(() => undefined);
        createIdlClient(loadTokenkegIdl(), {
            fallbackDecoder: { decodeAccount },
        }).decodeAccount(missAccountData());
        expect(decodeAccount).not.toHaveBeenCalled();
    });

    it('should land on the anchor arm when the decoder rescues an unmatched account', () => {
        const decode = createIdlClient(loadSimpleIdl(), {
            fallbackDecoder: { decodeAccount: () => ({ count: 7 }) },
        }).decodeAccount(missAccountData());
        if (decode.kind !== IdlStandard.Anchor) throw new Error('expected the anchor arm');
        expect(decode.decoded).toEqual({ count: 7 });
        // conversion succeeded, so no bypassed pipeline errors ride along
        expect(decode.recoveredFrom).toBeUndefined();
    });

    it('should fall to the unknown arm when the decoder returns undefined', () => {
        const decode = createIdlClient(loadSimpleIdl(), {
            fallbackDecoder: { decodeAccount: () => undefined },
        }).decodeAccount(missAccountData());
        expect(decode.kind).toBe('unknown');
    });

    it('should dispatch a rescued account through the handler map anchor branch', () => {
        const result = createIdlClient(loadSimpleIdl(), {
            fallbackDecoder: { decodeAccount: () => ({ count: 7 }) },
        }).decodeAccount(missAccountData(), {
            anchor: () => 'rescued' as const,
            codama: () => 'decoded' as const,
            unknown: () => 'miss' as const,
        });
        expect(result).toBe('rescued');
    });

    it('should return the rescued payload through decodeAccountData', () => {
        const [error, data] = createIdlClient(loadSimpleIdl(), {
            fallbackDecoder: { decodeAccount: () => ({ count: 7 }) },
        }).decodeAccountData<{ count: number }>(missAccountData());
        expect(error).toBeUndefined();
        expect(data).toEqual({ count: 7 });
    });
});

describe('unknown-arm errors contract', () => {
    it('should report a plain miss with an empty errors array', () => {
        const tokenkeg = loadTokenkegIdl();
        const decode = createIdlClient(tokenkeg).decodeInstruction({
            ...transferIx(tokenkeg),
            data: Uint8Array.from([99, 1, 2]),
        });
        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors).toEqual([]);
    });

    it('should carry the conversion error for a detected-but-unconvertible document', () => {
        const decode = createIdlClient(brokenAnchorIdl()).decodeInstruction(brokenIx());
        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors.map(e => e.code)).toEqual([IDL_ERROR__IDL_PARSE_FAILED]);
    });

    it('should keep the bypassed pipeline errors on a fallback rescue', () => {
        const decode = createIdlClient(brokenAnchorIdl(), {
            fallbackDecoder: { decodeInstruction: () => ({ name: 'boom' }) },
        }).decodeInstruction(brokenIx());
        if (decode.kind !== IdlStandard.Anchor) throw new Error('expected the anchor arm');
        expect(decode.recoveredFrom?.map(e => e.code)).toEqual([IDL_ERROR__IDL_PARSE_FAILED]);
    });

    it('should label a decode throw as an instruction-decode failure, not a document-parse failure', () => {
        const tokenkeg = loadTokenkegIdl();
        // the discriminator matches transfer (u8 3) but the u64 amount bytes are missing — the parser throws
        const decode = createIdlClient(tokenkeg).decodeInstruction({
            ...transferIx(tokenkeg),
            data: Uint8Array.from([3]),
        });
        if (decode.kind !== 'unknown') throw new Error('expected the unknown arm');
        expect(decode.errors.map(e => e.code)).toEqual([IDL_ERROR__INSTRUCTION_DECODE_FAILED]);
    });
});

// m=1, n=1, initialized, 11 zeroed signer pubkeys — identifies the tokenkeg multisig account by size
const multisigBytes = () => Uint8Array.from([1, 1, 1, ...new Uint8Array(11 * 32)]);

describe('decodeInstructionData / decodeAccountData (combined error-first decode)', () => {
    it('should return the instruction payload in the value slot', () => {
        const tokenkeg = loadTokenkegIdl();
        const [error, data] = createIdlClient(tokenkeg).decodeInstructionData<{
            amount: bigint;
        }>(transferIx(tokenkeg));
        expect(error).toBeUndefined();
        expect(data).toMatchObject({ amount: 42n });
    });

    it('should return the account payload in the value slot', () => {
        const [error, data] = createIdlClient(loadTokenkegIdl()).decodeAccountData<{
            m: number;
            n: number;
        }>(multisigBytes());
        expect(error).toBeUndefined();
        expect(data).toMatchObject({ m: 1, n: 1 });
    });

    it('should pass the kind assertion when the decode arm matches', () => {
        const tokenkeg = loadTokenkegIdl();
        const [error, data] = createIdlClient(tokenkeg).decodeInstructionData<{
            amount: bigint;
        }>(transferIx(tokenkeg), IdlStandard.Codama);
        expect(error).toBeUndefined();
        expect(data).toMatchObject({ amount: 42n });
    });

    it('should return the kind-mismatch error when the asserted kind differs', () => {
        const tokenkeg = loadTokenkegIdl();
        const [error, data] = createIdlClient(tokenkeg).decodeInstructionData(transferIx(tokenkeg), IdlStandard.Anchor);
        expect(data).toBeUndefined();
        expect(error?.code).toBe(IDL_ERROR__DECODE_KIND_MISMATCH);
        expect(error?.context).toEqual({ expected: IdlStandard.Anchor, received: IdlStandard.Codama });
    });

    it('should return the account kind-mismatch error when the asserted kind differs', () => {
        const tokenkeg = loadTokenkegIdl() as CodamaIdl;
        const [error, data] = createIdlClient(tokenkeg).decodeAccountData<unknown>(multisigBytes(), IdlStandard.Anchor);
        expect(data).toBeUndefined();
        expect(error?.code).toBe(IDL_ERROR__DECODE_KIND_MISMATCH);
        expect(error?.context).toEqual({ expected: IdlStandard.Anchor, received: IdlStandard.Codama });
    });

    it('should return a fresh decode-failed error for a plain instruction miss', () => {
        const tokenkeg = loadTokenkegIdl();
        const [error, data] = createIdlClient(tokenkeg).decodeInstructionData({
            ...transferIx(tokenkeg),
            data: Uint8Array.from([99, 1, 2]),
        });
        expect(data).toBeUndefined();
        expect(error?.code).toBe(IDL_ERROR__INSTRUCTION_DECODE_FAILED);
    });

    it('should return a fresh decode-failed error for a plain account miss', () => {
        const [error, data] = createIdlClient(loadSimpleIdl()).decodeAccountData(Uint8Array.from([1, 2, 3]));
        expect(data).toBeUndefined();
        expect(error?.code).toBe(IDL_ERROR__ACCOUNT_DECODE_FAILED);
        expect(error?.context).toMatchObject({ dataLength: 3 });
    });

    it('should surface the pipeline error for a detected-but-unconvertible document', () => {
        const [error, data] = createIdlClient(brokenAnchorIdl()).decodeInstructionData(brokenIx());
        expect(data).toBeUndefined();
        expect(error?.code).toBe(IDL_ERROR__IDL_PARSE_FAILED);
    });

    it('should surface the account pipeline error for a detected-but-unconvertible document', () => {
        const [error, data] = createIdlClient(brokenAnchorIdl()).decodeAccountData(missAccountData());
        expect(data).toBeUndefined();
        expect(error?.code).toBe(IDL_ERROR__IDL_PARSE_FAILED);
    });

    it('should report an instruction miss as the decode-failed error even when a kind is asserted', () => {
        // an unknown-arm decode becomes the decode-failed error — never a mismatch (documented ordering)
        const tokenkeg = loadTokenkegIdl();
        const [error, data] = createIdlClient(tokenkeg).decodeInstructionData(
            { ...transferIx(tokenkeg), data: Uint8Array.from([99, 1, 2]) },
            IdlStandard.Codama,
        );
        expect(data).toBeUndefined();
        expect(error?.code).toBe(IDL_ERROR__INSTRUCTION_DECODE_FAILED);
    });

    it('should report an account miss as the decode-failed error even when a kind is asserted', () => {
        const [error, data] = createIdlClient(loadSimpleIdl()).decodeAccountData(missAccountData(), IdlStandard.Codama);
        expect(data).toBeUndefined();
        expect(error?.code).toBe(IDL_ERROR__ACCOUNT_DECODE_FAILED);
    });

    it('should return the address mismatch as the error value instead of throwing', () => {
        // the two-step route fails loud on this wiring bug; the one-step route keeps it a value
        const tokenkeg = loadTokenkegIdl();
        const foreign = { ...transferIx(tokenkeg), programAddress: address('11111111111111111111111111111111') };
        const [error, data] = createIdlClient(tokenkeg).decodeInstructionData(foreign);
        expect(data).toBeUndefined();
        expect(error?.code).toBe(IDL_ERROR__IDL_ADDRESS_MISMATCH);
    });

    it('should rethrow non-mismatch engine throws', () => {
        const engine: IdlDecodeProvider = {
            decodeAccount: () => unknownArm([]),
            decodeInstruction: () => {
                throw new Error('provider failure');
            },
        };
        const simple = loadSimpleIdl();
        const client = createIdlClient(simple, { provider: engine });
        expect(() => client.decodeInstructionData(incrementIx(simple))).toThrowError('provider failure');
    });
});

describe('standard guards', () => {
    it('should narrow an Anchor client', () => {
        const client: IdlMetaClient = createIdlClient(loadSimpleIdl() as SupportedIdl);
        expect(isAnchorStandard(client)).toBe(true);
        expect(isCodamaStandard(client)).toBe(false);
    });

    it('should narrow a Codama client', () => {
        const client: IdlMetaClient = createIdlClient(loadTokenkegIdl() as SupportedIdl);
        expect(isCodamaStandard(client)).toBe(true);
        expect(isAnchorStandard(client)).toBe(false);
    });
});
