import { Keypair, type ParsedInstruction } from '@solana/web3.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Logger } from '@/app/shared/lib/logger';

import {
    decodeRpcBatchInstructions,
    extractSubInstructions,
    isRpcParsedBatchInstruction,
    rpcInfoToDecodedParams,
    safeLabel,
    stringifyValue,
} from '../rpc-parsed-batch';

const ADDRESS = Keypair.generate().publicKey.toBase58();

// Only `parsed` is read; the rest satisfies the ParsedInstruction shape.
function makeParsedIx(parsed: unknown): ParsedInstruction {
    return { parsed, program: 'spl-token', programId: Keypair.generate().publicKey } as unknown as ParsedInstruction;
}

beforeEach(() => {
    // Silence Logger and give every test a fresh call history to assert against.
    vi.spyOn(Logger, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
});

afterEach(() => {
    vi.restoreAllMocks();
});

describe('isRpcParsedBatchInstruction', () => {
    it('should return true for a parsed object with type "batch"', () => {
        expect(isRpcParsedBatchInstruction({ info: {}, type: 'batch' })).toBe(true);
    });

    it('should return false for other types, strings, null/undefined, and missing type', () => {
        expect(isRpcParsedBatchInstruction({ type: 'transfer' })).toBe(false);
        expect(isRpcParsedBatchInstruction('batch')).toBe(false);
        expect(isRpcParsedBatchInstruction(null)).toBe(false);
        expect(isRpcParsedBatchInstruction(undefined)).toBe(false);
        expect(isRpcParsedBatchInstruction({})).toBe(false);
    });
});

describe('stringifyValue', () => {
    it('should pass strings through', () => {
        expect(stringifyValue('hello')).toBe('hello');
    });

    it('should stringify numbers, bigints, and booleans', () => {
        expect(stringifyValue(42)).toBe('42');
        expect(stringifyValue(100000n)).toBe('100000');
        expect(stringifyValue(true)).toBe('true');
    });

    it('should unwrap RPC token-amount objects to uiAmountString', () => {
        expect(stringifyValue({ amount: '5000000', decimals: 6, uiAmount: 5, uiAmountString: '5' })).toBe('5');
    });

    it('should fall back to amount when uiAmountString is absent', () => {
        expect(stringifyValue({ amount: '123', decimals: 0 })).toBe('123');
    });

    it('should join arrays with a comma', () => {
        expect(stringifyValue(['a', 'b', 'c'])).toBe('a, b, c');
    });

    it('should JSON-stringify opaque objects', () => {
        expect(stringifyValue({ foo: 'bar' })).toBe('{"foo":"bar"}');
    });

    it('should return empty string for null and undefined', () => {
        expect(stringifyValue(null)).toBe('');
        expect(stringifyValue(undefined)).toBe('');
    });
});

describe('safeLabel', () => {
    it('should capital-case non-empty strings', () => {
        expect(safeLabel('mintAuthority', 'Unknown')).toBe('Mint Authority');
    });

    it('should return the fallback for non-strings and empty strings', () => {
        expect(safeLabel(undefined, 'Unknown')).toBe('Unknown');
        expect(safeLabel(7, 'Unknown')).toBe('Unknown');
        expect(safeLabel('', 'Unknown')).toBe('Unknown');
        expect(safeLabel(null, 'Unknown')).toBe('Unknown');
    });
});

describe('rpcInfoToDecodedParams', () => {
    it('should flag base58 pubkey values as addresses and scalars as plain fields', () => {
        const result = rpcInfoToDecodedParams({ amount: '1000', authority: ADDRESS });
        expect(result.accounts).toEqual([]);
        expect(result.fields).toEqual([
            { isAddress: false, label: 'Amount', value: '1000' },
            { isAddress: true, label: 'Authority', value: ADDRESS },
        ]);
    });

    it('should return no fields for empty info', () => {
        expect(rpcInfoToDecodedParams({})).toEqual({ accounts: [], fields: [] });
    });

    it('should format nested token-amount objects as their ui value', () => {
        const result = rpcInfoToDecodedParams({
            tokenAmount: { amount: '5000000', decimals: 6, uiAmountString: '5' },
        });
        expect(result.fields).toEqual([{ isAddress: false, label: 'Token Amount', value: '5' }]);
    });
});

describe('extractSubInstructions', () => {
    it('should return the sub-instructions under parsed.info.instructions', () => {
        const subs = [
            { info: {}, type: 'transfer' },
            { info: {}, type: 'mintTo' },
        ];
        expect(extractSubInstructions(makeParsedIx({ info: { instructions: subs }, type: 'batch' }))).toEqual(subs);
    });

    it('should return [] when parsed is a string', () => {
        expect(extractSubInstructions(makeParsedIx('batch'))).toEqual([]);
    });

    it('should return [] when info.instructions is missing', () => {
        expect(extractSubInstructions(makeParsedIx({ info: {}, type: 'batch' }))).toEqual([]);
    });

    it('should log and return [] when info.instructions is not an array', () => {
        expect(extractSubInstructions(makeParsedIx({ info: { instructions: 'oops' }, type: 'batch' }))).toEqual([]);
        expect(Logger.error).toHaveBeenCalledOnce();
    });

    it('should filter out non-object sub-instructions without logging', () => {
        const subs = [{ info: {}, type: 'transfer' }, null, 'bad', 42];
        expect(extractSubInstructions(makeParsedIx({ info: { instructions: subs }, type: 'batch' }))).toEqual([
            { info: {}, type: 'transfer' },
        ]);
        expect(Logger.error).not.toHaveBeenCalled();
    });
});

describe('decodeRpcBatchInstructions', () => {
    it('should map each sub-instruction to a typeName and decoded fields', () => {
        const ix = makeParsedIx({
            info: {
                instructions: [
                    { info: { amount: '1000', authority: ADDRESS }, type: 'transfer' },
                    { info: {}, type: 'syncNative' },
                ],
            },
            type: 'batch',
        });
        expect(decodeRpcBatchInstructions(ix)).toEqual([
            {
                decoded: {
                    accounts: [],
                    fields: [
                        { isAddress: false, label: 'Amount', value: '1000' },
                        { isAddress: true, label: 'Authority', value: ADDRESS },
                    ],
                },
                typeName: 'Transfer',
            },
            { decoded: { accounts: [], fields: [] }, typeName: 'Sync Native' },
        ]);
    });

    it('should not throw and should label a sub-instruction with a missing type as "Unknown"', () => {
        const ix = makeParsedIx({ info: { instructions: [{ info: { amount: '5' } }] }, type: 'batch' });
        expect(decodeRpcBatchInstructions(ix)).toEqual([
            {
                decoded: { accounts: [], fields: [{ isAddress: false, label: 'Amount', value: '5' }] },
                typeName: 'Unknown',
            },
        ]);
    });

    it('should coerce a non-object sub-instruction info to empty fields', () => {
        const ix = makeParsedIx({ info: { instructions: [{ info: 'not-an-object', type: 'foo' }] }, type: 'batch' });
        expect(decodeRpcBatchInstructions(ix)).toEqual([{ decoded: { accounts: [], fields: [] }, typeName: 'Foo' }]);
    });
});
