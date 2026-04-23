import bs58 from 'bs58';
import { describe, expect, it } from 'vitest';

import { buildSplMintRegions, SPL_MINT_LAYOUT, SPL_MINT_SIZE } from '../spl-token';

type MintBuilderOpts = {
    mintAuthority?: Uint8Array | null;
    supply?: bigint;
    decimals?: number;
    isInitialized?: boolean;
    freezeAuthority?: Uint8Array | null;
};

function buildSplMintBytes(opts: MintBuilderOpts = {}): Uint8Array {
    const bytes = new Uint8Array(SPL_MINT_SIZE);
    const view = new DataView(bytes.buffer);
    // mint_authority COption + pubkey
    if (opts.mintAuthority) {
        view.setUint32(0, 1, true);
        bytes.set(opts.mintAuthority, 4);
    }
    // supply (u64 LE at offset 36)
    view.setBigUint64(36, opts.supply ?? 0n, true);
    // decimals
    bytes[44] = opts.decimals ?? 6;
    // is_initialized
    bytes[45] = opts.isInitialized === false ? 0 : 1;
    // freeze_authority COption + pubkey
    if (opts.freezeAuthority) {
        view.setUint32(46, 1, true);
        bytes.set(opts.freezeAuthority, 50);
    }
    return bytes;
}

function zeros(n: number): Uint8Array {
    return new Uint8Array(n);
}

function fakePubkey(seed: number): Uint8Array {
    return new Uint8Array(32).fill(seed);
}

describe('buildSplMintRegions', () => {
    it('covers exactly 82 bytes with no gaps or overlaps', () => {
        const bytes = buildSplMintBytes({ mintAuthority: zeros(32), supply: 0n });
        const regions = buildSplMintRegions(bytes, undefined);

        const covered = regions.reduce((sum, r) => sum + r.length, 0);
        expect(covered).toBe(SPL_MINT_SIZE);

        const sorted = [...regions].sort((a, b) => a.start - b.start);
        sorted.reduce((nextExpectedStart, r) => {
            expect(r.start).toBe(nextExpectedStart);
            return r.start + r.length;
        }, 0);
    });

    it('emits one region per layout field in declaration order', () => {
        const bytes = buildSplMintBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        expect(regions.map(r => r.id)).toEqual(SPL_MINT_LAYOUT.map(f => f.id));
    });

    it('decodes supply as bigint from raw bytes when parsed is undefined', () => {
        const supply = (2n ** 60n) + 12345n;
        const bytes = buildSplMintBytes({ supply });
        const regions = buildSplMintRegions(bytes, undefined);

        const supplyRegion = regions.find(r => r.id === 'mint.supply')!;
        expect(supplyRegion.decodedValue.kind).toBe('amount');
        if (supplyRegion.decodedValue.kind !== 'amount') throw new Error('unreachable');
        expect(typeof supplyRegion.decodedValue.raw).toBe('bigint');
        expect(supplyRegion.decodedValue.raw).toBe(supply);
    });

    it('prefers parsed.supply over raw bytes when available', () => {
        const bytes = buildSplMintBytes({ supply: 999n });
        const regions = buildSplMintRegions(bytes, {
            decimals: 6,
            freezeAuthority: null,
            isInitialized: true,
            mintAuthority: null,
            supply: '1000000',
        });
        const supplyRegion = regions.find(r => r.id === 'mint.supply')!;
        if (supplyRegion.decodedValue.kind !== 'amount') throw new Error('unreachable');
        expect(supplyRegion.decodedValue.raw).toBe(1000000n);
    });

    it('encodes mint_authority as base58 from raw bytes when parsed is undefined', () => {
        const authority = fakePubkey(7);
        const bytes = buildSplMintBytes({ mintAuthority: authority });
        const regions = buildSplMintRegions(bytes, undefined);

        const authRegion = regions.find(r => r.id === 'mint.mintAuthority')!;
        if (authRegion.decodedValue.kind !== 'pubkey') throw new Error('unreachable');
        expect(authRegion.decodedValue.base58).toBe(bs58.encode(authority));
        expect(authRegion.decodedValue.isNone).toBeFalsy();
    });

    it('marks COption pubkey as isNone when tag=0', () => {
        const bytes = buildSplMintBytes({ mintAuthority: null });
        const regions = buildSplMintRegions(bytes, undefined);

        const authRegion = regions.find(r => r.id === 'mint.mintAuthority')!;
        if (authRegion.decodedValue.kind !== 'pubkey') throw new Error('unreachable');
        expect(authRegion.decodedValue.isNone).toBe(true);

        const tagRegion = regions.find(r => r.id === 'mint.mintAuthorityOption')!;
        if (tagRegion.decodedValue.kind !== 'option') throw new Error('unreachable');
        expect(tagRegion.decodedValue.present).toBe(false);
    });

    it('handles uninitialized mint (all zeros) without crashing', () => {
        const bytes = new Uint8Array(SPL_MINT_SIZE);
        const regions = buildSplMintRegions(bytes, undefined);

        const initRegion = regions.find(r => r.id === 'mint.isInitialized')!;
        if (initRegion.decodedValue.kind !== 'scalar') throw new Error('unreachable');
        expect(initRegion.decodedValue.value).toBe('No');
    });

    it('read-only invariant: rawData bytes unchanged after build', () => {
        const bytes = buildSplMintBytes({ mintAuthority: fakePubkey(3), supply: 42n });
        const snapshot = new Uint8Array(bytes);
        buildSplMintRegions(bytes, undefined);
        expect(bytes).toEqual(snapshot);
    });

    it('throws on truncated data (< 82 bytes)', () => {
        // eslint-disable-next-line no-restricted-syntax -- asserting specific error message with a unicode char
        expect(() => buildSplMintRegions(new Uint8Array(50), undefined)).toThrow(/≥ 82 bytes/);
    });

});
