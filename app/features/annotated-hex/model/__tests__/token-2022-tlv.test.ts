import { describe, expect, it } from 'vitest';

import { buildSplMintRegions, SPL_MINT_SIZE, SPL_TOKEN_ACCOUNT_SIZE, walkTokenExtensions } from '../spl-token';

type TlvEntry = { type: number; data: Uint8Array };

function appendTlvTail(base: Uint8Array, accountType: number, entries: TlvEntry[]): Uint8Array {
    const tailLen = 1 + entries.reduce((sum, e) => sum + 4 + e.data.length, 0);
    const out = new Uint8Array(base.length + tailLen);
    out.set(base, 0);
    out[base.length] = accountType;
    const view = new DataView(out.buffer);
    let pos = base.length + 1;
    for (const entry of entries) {
        view.setUint16(pos, entry.type, true);
        view.setUint16(pos + 2, entry.data.length, true);
        out.set(entry.data, pos + 4);
        pos += 4 + entry.data.length;
    }
    return out;
}

function baseMint(): Uint8Array {
    return new Uint8Array(SPL_MINT_SIZE);
}

describe('walkTokenExtensions', () => {
    it('emits no regions when no tail exists', () => {
        const bytes = baseMint();
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        expect(regions).toHaveLength(0);
    });

    it('emits only the account-type region when tail is just the discriminator byte', () => {
        const bytes = appendTlvTail(baseMint(), 1, []);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        expect(regions).toHaveLength(1);
        expect(regions[0].start).toBe(SPL_MINT_SIZE);
        expect(regions[0].length).toBe(1);
        if (regions[0].decodedValue.kind !== 'scalar') throw new Error('unreachable');
        expect(regions[0].decodedValue.label).toBe('Mint');
    });

    it('walks a single known zero-length extension (ImmutableOwner) — header only', () => {
        const bytes = appendTlvTail(baseMint(), 1, [{ data: new Uint8Array(0), type: 7 }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        // accountType (1) + header (4) = 2 regions, no data region for zero-length
        expect(regions).toHaveLength(2);
        expect(regions[1].name).toContain('ImmutableOwner');
        expect(regions[1].length).toBe(4);
    });

    it('walks multiple extensions preserving order and byte offsets (undecoded types)', () => {
        // Uses type 2 (TransferFeeAmount) + type 11 (CpiGuard): both are known names but
        // do not have sub-region decoders yet, so they emit as header+opaque-data pairs.
        const bytes = appendTlvTail(baseMint(), 1, [
            { data: new Uint8Array(8).fill(0xAA), type: 2 },
            { data: new Uint8Array(1).fill(0x01), type: 11 },
        ]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        // accountType + (header+data) + (header+data) = 5 regions
        expect(regions).toHaveLength(5);
        expect(regions.map(r => r.name)).toEqual([
            'Token-2022 Account Type',
            'TransferFeeAmount — Header',
            'TransferFeeAmount — Data',
            'CpiGuard — Header',
            'CpiGuard — Data',
        ]);

        // Each region is contiguous with the previous
        regions.reduce((expectedStart, r) => {
            expect(r.start).toBe(expectedStart);
            return r.start + r.length;
        }, SPL_MINT_SIZE);
    });

    it('unknown extension type does not abort the loop; subsequent known extension still emits', () => {
        // Use an undecoded known type (#2, TransferFeeAmount) as the second entry
        // so the assertion can reliably compare region count without dispatcher interference.
        const bytes = appendTlvTail(baseMint(), 1, [
            { data: new Uint8Array(8).fill(0xFF), type: 0xFE }, // unknown
            { data: new Uint8Array(8).fill(0xAA), type: 2 }, // TransferFeeAmount (no decoder)
        ]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        expect(regions).toHaveLength(5);
        expect(regions[1].name).toContain('Unknown (#254)');
        if (regions[2].decodedValue.kind !== 'unparsed') throw new Error('unreachable');
        expect(regions[2].decodedValue.reason).toBe('unknown-ext');
        // Known extension after unknown is still emitted
        expect(regions[3].name).toContain('TransferFeeAmount');
    });

    it('TLV fuzz: extLen=0xFFFF with insufficient remaining bytes emits truncated region and halts', () => {
        // Build a buffer by hand: base (82) + accountType + header claiming 65535 + only 10 data bytes
        const bytes = new Uint8Array(SPL_MINT_SIZE + 1 + 4 + 10);
        bytes[SPL_MINT_SIZE] = 1;
        const view = new DataView(bytes.buffer);
        view.setUint16(SPL_MINT_SIZE + 1, 1, true); // ext type = 1 (TransferFeeConfig)
        view.setUint16(SPL_MINT_SIZE + 3, 0xFFFF, true); // claimed length

        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));

        // account-type + header + truncated = 3 regions
        expect(regions).toHaveLength(3);
        expect(regions[2].name).toContain('Truncated');
        if (regions[2].decodedValue.kind !== 'unparsed') throw new Error('unreachable');
        expect(regions[2].decodedValue.reason).toBe('truncated');

        // No region extends past the buffer end
        for (const r of regions) {
            expect(r.start + r.length).toBeLessThanOrEqual(bytes.length);
        }
    });

    it('truncated header (only 1–3 bytes after accountType) emits truncated region and halts', () => {
        const bytes = new Uint8Array(SPL_MINT_SIZE + 1 + 2); // header needs 4 bytes, only 2 available
        bytes[SPL_MINT_SIZE] = 1;
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        expect(regions).toHaveLength(2); // accountType + truncated-header
        expect(regions[1].name).toBe('Truncated Extension Header');
        expect(regions[1].length).toBe(2);
    });

    it('stops at a type=0 sentinel and emits a single Padding region for the rest', () => {
        // Real extension followed by zero-padding. Walker must emit the real ext,
        // then one Padding region, not N bogus zero-length "Uninitialized" headers.
        const base = baseMint();
        const real = { data: new Uint8Array(32), type: 3 }; // MintCloseAuthority, 32 bytes
        // Build: base + accountType + real TLV + 40 zero bytes (padding)
        const bytes = new Uint8Array(base.length + 1 + 4 + real.data.length + 40);
        bytes.set(base, 0);
        bytes[base.length] = 1;
        const view = new DataView(bytes.buffer);
        view.setUint16(base.length + 1, real.type, true);
        view.setUint16(base.length + 3, real.data.length, true);

        const regions = Array.from(walkTokenExtensions(bytes, base.length));
        const names = regions.map(r => r.name);
        expect(names).toContain('MintCloseAuthority — Header');
        expect(names).toContain('Padding');
        // Exactly one Padding region, not one per 4 bytes of zeros.
        expect(names.filter(n => n === 'Padding')).toHaveLength(1);
    });

    it('buildSplMintRegions for Token-2022 layout: padding 82..165 + TLV from 165', () => {
        // Construct a Token-2022 mint: 82 base + 83 zero-padding + accountType(1) at 165
        // + header(4) + 32 bytes for MintCloseAuthority.
        const bytes = new Uint8Array(SPL_MINT_SIZE + 83 + 1 + 4 + 32);
        bytes[165] = 1; // accountType = Mint
        const view = new DataView(bytes.buffer);
        view.setUint16(166, 3, true); // MintCloseAuthority
        view.setUint16(168, 32, true);

        const regions = buildSplMintRegions(bytes, undefined);

        // Expect: 7 mint regions + 1 padding region + 1 accountType + 1 ext header + 1 close-authority
        expect(regions.find(r => r.name === 'Padding')?.start).toBe(SPL_MINT_SIZE);
        expect(regions.find(r => r.name === 'Padding')?.length).toBe(SPL_TOKEN_ACCOUNT_SIZE - SPL_MINT_SIZE);
        expect(regions.find(r => r.name === 'Token-2022 Account Type')?.start).toBe(SPL_TOKEN_ACCOUNT_SIZE);
        expect(regions.find(r => r.name?.includes('MintCloseAuthority — Header'))).toBeDefined();
        expect(regions.find(r => r.name === 'MintCloseAuthority — Close Authority')).toBeDefined();
    });

    it('buildSplMintRegions tolerates unusual tail (< 165 bytes) without crashing', () => {
        // Tail bytes that don't reach the Token-2022 discriminator offset at 165.
        const bytes = new Uint8Array(100);
        const regions = buildSplMintRegions(bytes, undefined);
        expect(regions.find(r => r.name === 'Unknown tail')).toBeDefined();
    });

});
