import bs58 from 'bs58';
import { describe, expect, it } from 'vitest';

import {
    buildSplTokenAccountRegions,
    ParsedTokenAccountInfo,
    SPL_TOKEN_ACCOUNT_LAYOUT,
    SPL_TOKEN_ACCOUNT_SIZE,
} from '../spl-token';

type TokenAccountBuilderOpts = {
    mint?: Uint8Array;
    owner?: Uint8Array;
    amount?: bigint;
    delegate?: Uint8Array | null;
    state?: 0 | 1 | 2;
    isNative?: boolean;
    nativeAmount?: bigint;
    delegatedAmount?: bigint;
    closeAuthority?: Uint8Array | null;
};

function buildSplTokenAccountBytes(opts: TokenAccountBuilderOpts = {}): Uint8Array {
    const bytes = new Uint8Array(SPL_TOKEN_ACCOUNT_SIZE);
    const view = new DataView(bytes.buffer);
    bytes.set(opts.mint ?? new Uint8Array(32), 0);
    bytes.set(opts.owner ?? new Uint8Array(32), 32);
    view.setBigUint64(64, opts.amount ?? 0n, true);
    if (opts.delegate) {
        view.setUint32(72, 1, true);
        bytes.set(opts.delegate, 76);
    }
    bytes[108] = opts.state ?? 1;
    if (opts.isNative) {
        view.setUint32(109, 1, true);
        view.setBigUint64(113, opts.nativeAmount ?? 0n, true);
    }
    view.setBigUint64(121, opts.delegatedAmount ?? 0n, true);
    if (opts.closeAuthority) {
        view.setUint32(129, 1, true);
        bytes.set(opts.closeAuthority, 133);
    }
    return bytes;
}

function fakePubkey(seed: number): Uint8Array {
    return new Uint8Array(32).fill(seed);
}

describe('buildSplTokenAccountRegions', () => {
    it('covers exactly 165 bytes with no gaps or overlaps', () => {
        const bytes = buildSplTokenAccountBytes();
        const regions = buildSplTokenAccountRegions(bytes, undefined);

        const covered = regions.reduce((sum, r) => sum + r.length, 0);
        expect(covered).toBe(SPL_TOKEN_ACCOUNT_SIZE);

        const sorted = [...regions].sort((a, b) => a.start - b.start);
        sorted.reduce((nextExpectedStart, r) => {
            expect(r.start).toBe(nextExpectedStart);
            return r.start + r.length;
        }, 0);
    });

    it('emits one region per layout field in declaration order', () => {
        const regions = buildSplTokenAccountRegions(buildSplTokenAccountBytes(), undefined);
        expect(regions.map(r => r.id)).toEqual(SPL_TOKEN_ACCOUNT_LAYOUT.map(f => f.id));
    });

    it('decodes mint and owner as base58 from raw bytes when parsed is undefined', () => {
        const mint = fakePubkey(3);
        const owner = fakePubkey(7);
        const bytes = buildSplTokenAccountBytes({ mint, owner });
        const regions = buildSplTokenAccountRegions(bytes, undefined);

        const mintRegion = regions.find(r => r.id === 'token.mint')!;
        const ownerRegion = regions.find(r => r.id === 'token.owner')!;
        if (mintRegion.decodedValue.kind !== 'pubkey') throw new Error('unreachable');
        if (ownerRegion.decodedValue.kind !== 'pubkey') throw new Error('unreachable');
        expect(mintRegion.decodedValue.base58).toBe(bs58.encode(mint));
        expect(ownerRegion.decodedValue.base58).toBe(bs58.encode(owner));
    });

    it('decodes amount as bigint preserving precision above 2^53', () => {
        const amount = 2n ** 60n + 42n;
        const regions = buildSplTokenAccountRegions(buildSplTokenAccountBytes({ amount }), undefined);
        const amountRegion = regions.find(r => r.id === 'token.amount')!;
        if (amountRegion.decodedValue.kind !== 'amount') throw new Error('unreachable');
        expect(amountRegion.decodedValue.raw).toBe(amount);
    });

    it('prefers parsed.tokenAmount over raw bytes when available', () => {
        const parsed: ParsedTokenAccountInfo = {
            isNative: false,
            mint: { toBase58: () => 'MintPubkey' },
            owner: { toBase58: () => 'OwnerPubkey' },
            state: 'initialized',
            tokenAmount: { amount: '1000000', decimals: 6 },
        };
        const regions = buildSplTokenAccountRegions(buildSplTokenAccountBytes({ amount: 999n }), parsed);
        const amountRegion = regions.find(r => r.id === 'token.amount')!;
        if (amountRegion.decodedValue.kind !== 'amount') throw new Error('unreachable');
        expect(amountRegion.decodedValue.raw).toBe(1000000n);
        expect(amountRegion.decodedValue.decimals).toBe(6);
    });

    it('delegate COption: tag=0 → isNone=true, pubkey slot still in layout', () => {
        const regions = buildSplTokenAccountRegions(buildSplTokenAccountBytes({ delegate: null }), undefined);
        const tag = regions.find(r => r.id === 'token.delegateOption')!;
        const delegate = regions.find(r => r.id === 'token.delegate')!;
        if (tag.decodedValue.kind !== 'option') throw new Error('unreachable');
        if (delegate.decodedValue.kind !== 'pubkey') throw new Error('unreachable');
        expect(tag.decodedValue.present).toBe(false);
        expect(delegate.decodedValue.isNone).toBe(true);
        expect(delegate.start).toBe(76);
        expect(delegate.length).toBe(32);
    });

    it('state byte: 0=uninitialized, 1=initialized, 2=frozen (via raw bytes)', () => {
        for (const [byte, expected] of [[0, 'uninitialized'], [1, 'initialized'], [2, 'frozen']] as const) {
            const bytes = buildSplTokenAccountBytes({ state: byte as 0 | 1 | 2 });
            const regions = buildSplTokenAccountRegions(bytes, undefined);
            const stateRegion = regions.find(r => r.id === 'token.state')!;
            if (stateRegion.decodedValue.kind !== 'scalar') throw new Error('unreachable');
            expect(stateRegion.decodedValue.value).toBe(byte);
            expect(stateRegion.decodedValue.label).toBe(expected);
        }
    });

    it('isNative=true: nativeAmount region renders as rent-exempt reserve amount', () => {
        const bytes = buildSplTokenAccountBytes({ isNative: true, nativeAmount: 2039280n });
        const regions = buildSplTokenAccountRegions(bytes, undefined);
        const nativeRegion = regions.find(r => r.id === 'token.nativeAmount')!;
        if (nativeRegion.decodedValue.kind !== 'amount') throw new Error('unreachable');
        expect(nativeRegion.decodedValue.raw).toBe(2039280n);
    });

    it('isNative=false: nativeAmount region marked unparsed (reserved slot)', () => {
        const bytes = buildSplTokenAccountBytes({ isNative: false });
        const regions = buildSplTokenAccountRegions(bytes, undefined);
        const nativeRegion = regions.find(r => r.id === 'token.nativeAmount')!;
        expect(nativeRegion.decodedValue.kind).toBe('unparsed');
    });

    it('throws on truncated data (< 165 bytes)', () => {
        // eslint-disable-next-line no-restricted-syntax -- asserting specific error message with a unicode char
        expect(() => buildSplTokenAccountRegions(new Uint8Array(100), undefined)).toThrow(/≥ 165 bytes/);
    });

    it('read-only invariant: rawData bytes unchanged after build', () => {
        const bytes = buildSplTokenAccountBytes({ amount: 42n, mint: fakePubkey(1), owner: fakePubkey(2) });
        const snapshot = new Uint8Array(bytes);
        buildSplTokenAccountRegions(bytes, undefined);
        expect(bytes).toEqual(snapshot);
    });

    it('every region has a valid FieldKind matching the layout', () => {
        const regions = buildSplTokenAccountRegions(buildSplTokenAccountBytes(), undefined);
        const expected = new Map<string, string>(SPL_TOKEN_ACCOUNT_LAYOUT.map(f => [f.id, f.kind]));
        for (const r of regions) {
            expect(r.kind).toBe(expected.get(r.id));
        }
    });
});
