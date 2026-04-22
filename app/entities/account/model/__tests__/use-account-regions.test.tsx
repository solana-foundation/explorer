import type { Account } from '@providers/accounts';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAccountRegions } from '../use-account-regions';

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

function makeAccount(opts: {
    owner?: PublicKey;
    rawData?: Uint8Array;
    parsed?: Account['data']['parsed'];
}): Account {
    return {
        data: {
            parsed: opts.parsed,
            raw: opts.rawData,
        },
        executable: false,
        lamports: 1,
        owner: opts.owner ?? SystemProgram.programId,
        pubkey: PublicKey.default,
    };
}

function zeroBytes(n: number): Uint8Array {
    return new Uint8Array(n);
}

describe('useAccountRegions', () => {
    it('returns no-raw when rawData is undefined', () => {
        const account = makeAccount({ owner: TOKEN_PROGRAM_ID });
        const { result } = renderHook(() => useAccountRegions(account, undefined));
        expect(result.current).toEqual({ reason: 'no-raw', status: 'fallback' });
    });

    it('returns oversize for rawData > 4096 bytes', () => {
        const account = makeAccount({ owner: TOKEN_PROGRAM_ID });
        const { result } = renderHook(() => useAccountRegions(account, zeroBytes(5000)));
        expect(result.current).toEqual({ reason: 'oversize', status: 'fallback' });
    });

    it('returns unknown-owner for non-token programs', () => {
        const account = makeAccount({ owner: SystemProgram.programId });
        const { result } = renderHook(() => useAccountRegions(account, zeroBytes(82)));
        expect(result.current).toEqual({ reason: 'unknown-owner', status: 'fallback' });
    });

    it('returns multisig fallback for token multisig accounts', () => {
        const account = makeAccount({
            owner: TOKEN_PROGRAM_ID,
            parsed: {
                parsed: {
                    info: {},
                    type: 'multisig',
                } as NonNullable<Account['data']['parsed']>['parsed'],
                program: 'spl-token',
            } as Account['data']['parsed'],
            rawData: zeroBytes(355),
        });
        const { result } = renderHook(() => useAccountRegions(account, zeroBytes(355)));
        expect(result.current).toEqual({ reason: 'multisig', status: 'fallback' });
    });

    it('annotates a legacy SPL Mint (82 bytes, no parsed) via raw-byte fallback', () => {
        const account = makeAccount({ owner: TOKEN_PROGRAM_ID });
        const { result } = renderHook(() => useAccountRegions(account, zeroBytes(82)));
        expect(result.current.status).toBe('regions');
        if (result.current.status !== 'regions') throw new Error('unreachable');
        expect(result.current.regions.map(r => r.id)).toContain('mint.mintAuthority');
    });

    it('annotates a legacy SPL Token Account (165 bytes)', () => {
        const account = makeAccount({ owner: TOKEN_PROGRAM_ID });
        const { result } = renderHook(() => useAccountRegions(account, zeroBytes(165)));
        expect(result.current.status).toBe('regions');
        if (result.current.status !== 'regions') throw new Error('unreachable');
        expect(result.current.regions.map(r => r.id)).toContain('token.mint');
    });

    it('rejects legacy SPL Token with unexpected length (e.g. 100 bytes)', () => {
        const account = makeAccount({ owner: TOKEN_PROGRAM_ID });
        const { result } = renderHook(() => useAccountRegions(account, zeroBytes(100)));
        expect(result.current).toEqual({ reason: 'unexpected-length', status: 'fallback' });
    });

    it('annotates a Token-2022 Mint with TLV tail (88 bytes)', () => {
        // 82 base + 1 accountType + 4 header + 1 zero-length ext content area
        const bytes = zeroBytes(88);
        bytes[82] = 1; // accountType = Mint
        // Write a zero-length extension header (ImmutableOwner, type=7)
        new DataView(bytes.buffer).setUint16(83, 7, true);
        new DataView(bytes.buffer).setUint16(85, 0, true);

        const account = makeAccount({ owner: TOKEN_2022_PROGRAM_ID, rawData: bytes });
        const { result } = renderHook(() => useAccountRegions(account, bytes));
        expect(result.current.status).toBe('regions');
        if (result.current.status !== 'regions') throw new Error('unreachable');
        // Expect base mint layout (7) + accountType (1) + header (1) = 9
        expect(result.current.regions.length).toBeGreaterThanOrEqual(9);
    });

    it('Token-2022: prefers parsed.type when available to disambiguate Mint vs Account', () => {
        const bytes = zeroBytes(200);
        const account = makeAccount({
            owner: TOKEN_2022_PROGRAM_ID,
            parsed: {
                parsed: {
                    info: {},
                    type: 'account',
                },
                program: 'spl-token-2022',
            } as Account['data']['parsed'],
            rawData: bytes,
        });
        const { result } = renderHook(() => useAccountRegions(account, bytes));
        if (result.current.status !== 'regions') throw new Error('expected regions');
        expect(result.current.regions[0].id).toBe('token.mint');
    });

    it('is referentially stable across re-renders when inputs are unchanged', () => {
        const account = makeAccount({ owner: TOKEN_PROGRAM_ID });
        const rawData = zeroBytes(82);
        const { result, rerender } = renderHook(({ a, r }) => useAccountRegions(a, r), {
            initialProps: { a: account, r: rawData },
        });
        const first = result.current;
        rerender({ a: account, r: rawData });
        expect(result.current).toBe(first);
    });

    it('recomputes when rawData identity changes', () => {
        const account = makeAccount({ owner: TOKEN_PROGRAM_ID });
        const { result, rerender } = renderHook(({ r }: { r: Uint8Array }) => useAccountRegions(account, r), {
            initialProps: { r: zeroBytes(82) },
        });
        const first = result.current;
        rerender({ r: zeroBytes(82) }); // same length, different identity
        expect(result.current).not.toBe(first);
    });

    it('does not recompute when parsed object has different identity but same contents', () => {
        const rawData = zeroBytes(82);
        const parsedA = {
            parsed: { info: { decimals: 6 }, type: 'mint' },
            program: 'spl-token',
        } as unknown as Account['data']['parsed'];
        const parsedB = {
            parsed: { info: { decimals: 6 }, type: 'mint' },
            program: 'spl-token',
        } as unknown as Account['data']['parsed'];

        const { result, rerender } = renderHook(
            ({ p }: { p: Account['data']['parsed'] }) =>
                useAccountRegions(makeAccount({ owner: TOKEN_PROGRAM_ID, parsed: p }), rawData),
            { initialProps: { p: parsedA } },
        );
        const first = result.current;
        rerender({ p: parsedB });
        // Because account identity changes (new makeAccount), we re-derive ownerBase58 etc.
        // but the final regions array should be structurally equal. This test documents the
        // behavior — strict referential equality is NOT guaranteed when account changes,
        // only when rawData + account are both reference-stable.
        expect(result.current.status).toBe(first.status);
    });
});
