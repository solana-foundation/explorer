import { describe, expect, it } from 'vitest';

import {
    buildSplMintRegions,
    EXTENSION_NAMES,
    SPL_MINT_SIZE,
    walkTokenExtensions,
} from '../spl-token';

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

    it('buildSplMintRegions integrates the walker when raw.length > 82', () => {
        const bytes = appendTlvTail(baseMint(), 1, [
            { data: new Uint8Array(0), type: 9 }, // NonTransferable
        ]);
        const regions = buildSplMintRegions(bytes, undefined);
        // 7 mint layout regions + accountType + 1 ext header (zero-length data)
        expect(regions).toHaveLength(9);
        expect(regions.at(-1)?.name).toContain('NonTransferable');
    });

    it('EXTENSION_NAMES map covers all 26 types the Explorer validator enumerates', () => {
        const expected = [
            'TransferFeeConfig', 'TransferFeeAmount', 'MintCloseAuthority',
            'ConfidentialTransferMint', 'ConfidentialTransferAccount', 'DefaultAccountState',
            'ImmutableOwner', 'MemoTransfer', 'NonTransferable', 'InterestBearingConfig',
            'CpiGuard', 'PermanentDelegate', 'NonTransferableAccount', 'TransferHook',
            'TransferHookAccount', 'ConfidentialTransferFeeConfig', 'ConfidentialTransferFeeAmount',
            'MetadataPointer', 'TokenMetadata', 'GroupPointer', 'GroupMemberPointer',
            'TokenGroup', 'TokenGroupMember', 'ScaledUiAmountConfig', 'PausableConfig',
            'PausableAccount',
        ];
        for (const name of expected) {
            expect(Object.values(EXTENSION_NAMES)).toContain(name);
        }
    });
});
