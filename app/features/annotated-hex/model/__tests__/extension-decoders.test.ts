import bs58 from 'bs58';
import { describe, expect, it } from 'vitest';

import { SPL_MINT_SIZE, walkTokenExtensions } from '../spl-token';

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

function fakePubkey(seed: number): Uint8Array {
    return new Uint8Array(32).fill(seed);
}

function borshString(text: string): Uint8Array {
    const utf8 = new TextEncoder().encode(text);
    const out = new Uint8Array(4 + utf8.length);
    new DataView(out.buffer).setUint32(0, utf8.length, true);
    out.set(utf8, 4);
    return out;
}

function concat(...parts: Uint8Array[]): Uint8Array {
    const total = parts.reduce((s, p) => s + p.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
        out.set(p, offset);
        offset += p.length;
    }
    return out;
}

describe('MintCloseAuthority decoder (type 3)', () => {
    it('emits a single 32-byte close-authority region after the header', () => {
        const auth = fakePubkey(0x11);
        const bytes = appendTlvTail(baseMint(), 1, [{ type: 3, data: auth }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        // accountType + header + closeAuthority = 3
        expect(regions).toHaveLength(3);
        expect(regions[2].name).toBe('MintCloseAuthority — Close Authority');
        expect(regions[2].length).toBe(32);
        if (regions[2].decodedValue.kind !== 'pubkey') throw new Error('unreachable');
        expect(regions[2].decodedValue.base58).toBe(bs58.encode(auth));
        expect(regions[2].decodedValue.isNone).toBeFalsy();
    });

    it('renders all-zero bytes as isNone (OptionalNonZeroPubkey)', () => {
        const bytes = appendTlvTail(baseMint(), 1, [{ type: 3, data: new Uint8Array(32) }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        if (regions[2].decodedValue.kind !== 'pubkey') throw new Error('unreachable');
        expect(regions[2].decodedValue.isNone).toBe(true);
    });
});

describe('PermanentDelegate decoder (type 12)', () => {
    it('emits a 32-byte delegate region', () => {
        const delegate = fakePubkey(0x22);
        const bytes = appendTlvTail(baseMint(), 1, [{ type: 12, data: delegate }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        expect(regions).toHaveLength(3);
        expect(regions[2].name).toBe('PermanentDelegate — Delegate');
        if (regions[2].decodedValue.kind !== 'pubkey') throw new Error('unreachable');
        expect(regions[2].decodedValue.base58).toBe(bs58.encode(delegate));
    });
});

describe('MetadataPointer decoder (type 18)', () => {
    it('emits authority + metadata-address sub-regions', () => {
        const auth = fakePubkey(0x33);
        const mdAddr = fakePubkey(0x44);
        const bytes = appendTlvTail(baseMint(), 1, [{ type: 18, data: concat(auth, mdAddr) }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        // accountType + header + authority + mdAddress = 4
        expect(regions).toHaveLength(4);
        expect(regions[2].name).toBe('MetadataPointer — Authority');
        expect(regions[3].name).toBe('MetadataPointer — Metadata Address');
        if (regions[2].decodedValue.kind !== 'pubkey') throw new Error('unreachable');
        if (regions[3].decodedValue.kind !== 'pubkey') throw new Error('unreachable');
        expect(regions[2].decodedValue.base58).toBe(bs58.encode(auth));
        expect(regions[3].decodedValue.base58).toBe(bs58.encode(mdAddr));
    });

    it('sub-regions are contiguous with the header', () => {
        const bytes = appendTlvTail(baseMint(), 1, [{ type: 18, data: new Uint8Array(64) }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        const header = regions[1];
        const auth = regions[2];
        const addr = regions[3];
        expect(auth.start).toBe(header.start + header.length);
        expect(addr.start).toBe(auth.start + auth.length);
    });
});

describe('InterestBearingConfig decoder (type 10)', () => {
    it('emits 5 sub-regions with correct signed integer decoding', () => {
        const rateAuth = fakePubkey(0x55);
        const data = new Uint8Array(52);
        data.set(rateAuth, 0);
        const view = new DataView(data.buffer);
        view.setBigInt64(32, 1_700_000_000n, true);
        view.setInt16(40, -250, true); // -250 bps
        view.setBigInt64(42, 1_750_000_000n, true);
        view.setInt16(50, 300, true); // 300 bps

        const bytes = appendTlvTail(baseMint(), 1, [{ type: 10, data }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        // accountType + header + 5 sub-regions = 7
        expect(regions).toHaveLength(7);
        expect(regions.map(r => r.name)).toEqual([
            'Token-2022 Account Type',
            'InterestBearingConfig — Header',
            'InterestBearing — Rate Authority',
            'InterestBearing — Initialization Timestamp',
            'InterestBearing — Pre-update Average Rate',
            'InterestBearing — Last Update Timestamp',
            'InterestBearing — Current Rate',
        ]);

        if (regions[4].decodedValue.kind !== 'text') throw new Error('unreachable');
        expect(regions[4].decodedValue.value).toBe('-250 bps');
        if (regions[6].decodedValue.kind !== 'text') throw new Error('unreachable');
        expect(regions[6].decodedValue.value).toBe('300 bps');
        if (regions[3].decodedValue.kind !== 'text') throw new Error('unreachable');
        expect(regions[3].decodedValue.value).toBe('1700000000');
    });
});

describe('TokenMetadata decoder (type 19)', () => {
    function buildTokenMetadataData(opts: {
        updateAuthority?: Uint8Array;
        mint?: Uint8Array;
        name?: string;
        symbol?: string;
        uri?: string;
    }): Uint8Array {
        return concat(
            opts.updateAuthority ?? new Uint8Array(32),
            opts.mint ?? fakePubkey(0x99),
            borshString(opts.name ?? ''),
            borshString(opts.symbol ?? ''),
            borshString(opts.uri ?? ''),
        );
    }

    it('emits updateAuthority, mint, name, symbol, uri sub-regions', () => {
        const data = buildTokenMetadataData({
            updateAuthority: fakePubkey(0xaa),
            mint: fakePubkey(0xbb),
            name: 'My Token',
            symbol: 'MYT',
            uri: 'https://example.com/metadata.json',
        });
        const bytes = appendTlvTail(baseMint(), 1, [{ type: 19, data }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        const names = regions.map(r => r.name);
        expect(names).toContain('TokenMetadata — Update Authority');
        expect(names).toContain('TokenMetadata — Mint');
        expect(names).toContain('TokenMetadata — Name');
        expect(names).toContain('TokenMetadata — Symbol');
        expect(names).toContain('TokenMetadata — URI');

        const uriRegion = regions.find(r => r.name === 'TokenMetadata — URI')!;
        if (uriRegion.decodedValue.kind !== 'text') throw new Error('unreachable');
        expect(uriRegion.decodedValue.value).toBe('https://example.com/metadata.json');
    });

    it('security: javascript: URI rendered as plain text, never as a link', () => {
        const data = buildTokenMetadataData({ name: 'X', symbol: 'X', uri: 'javascript:alert(1)' });
        const bytes = appendTlvTail(baseMint(), 1, [{ type: 19, data }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        const uriRegion = regions.find(r => r.name === 'TokenMetadata — URI')!;
        if (uriRegion.decodedValue.kind !== 'text') throw new Error('unreachable');
        expect(uriRegion.decodedValue.value).toBe('javascript:alert(1)');
        // The DecodedValue is text/string — rendering as-is via React auto-escapes.
        // An <a href> link would require explicit opt-in; none exists in this path.
    });

    it('security: bidi override in name is sanitized', () => {
        const RLO = String.fromCodePoint(0x202e);
        const REPLACEMENT = String.fromCodePoint(0xfffd);
        const data = buildTokenMetadataData({ name: `${RLO}spoofed`, symbol: 'X', uri: '' });
        const bytes = appendTlvTail(baseMint(), 1, [{ type: 19, data }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        const nameRegion = regions.find(r => r.name === 'TokenMetadata — Name')!;
        if (nameRegion.decodedValue.kind !== 'text') throw new Error('unreachable');
        expect(nameRegion.decodedValue.value).not.toContain(RLO);
        expect(nameRegion.decodedValue.value).toContain(REPLACEMENT);
    });

    it('security: control chars in name are sanitized', () => {
        const NUL = String.fromCodePoint(0x00);
        const BEL = String.fromCodePoint(0x07);
        const REPLACEMENT = String.fromCodePoint(0xfffd);
        const data = buildTokenMetadataData({ name: `A${NUL}B${BEL}C`, symbol: 'X', uri: '' });
        const bytes = appendTlvTail(baseMint(), 1, [{ type: 19, data }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        const nameRegion = regions.find(r => r.name === 'TokenMetadata — Name')!;
        if (nameRegion.decodedValue.kind !== 'text') throw new Error('unreachable');
        expect(nameRegion.decodedValue.value).toBe(`A${REPLACEMENT}B${REPLACEMENT}C`);
    });

    it('security: overly long strings are truncated to MAX_DISPLAY_STRING', () => {
        const huge = 'x'.repeat(10_000);
        const data = buildTokenMetadataData({ name: 'X', symbol: 'X', uri: huge });
        const bytes = appendTlvTail(baseMint(), 1, [{ type: 19, data }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        const uriRegion = regions.find(r => r.name === 'TokenMetadata — URI')!;
        if (uriRegion.decodedValue.kind !== 'text') throw new Error('unreachable');
        expect(uriRegion.decodedValue.value.length).toBeLessThanOrEqual(257); // 256 + ellipsis
        expect(uriRegion.decodedValue.value.endsWith('…')).toBe(true);
    });

    it('graceful truncation: TLV declares a long string with no remaining bytes', () => {
        // Construct a TokenMetadata payload where the URI length prefix claims 100 bytes
        // but the TLV entry only has 4 bytes of slack.
        const partial = concat(
            new Uint8Array(32), // updateAuthority
            fakePubkey(1), // mint
            borshString('N'), // name
            borshString('S'), // symbol
        );
        const uriLenPrefix = new Uint8Array(4);
        new DataView(uriLenPrefix.buffer).setUint32(0, 100, true);
        const data = concat(partial, uriLenPrefix); // declares 100 bytes, provides 0

        const bytes = appendTlvTail(baseMint(), 1, [{ type: 19, data }]);
        const regions = Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        const truncated = regions.find(r => r.name.includes('truncated'));
        expect(truncated).toBeDefined();
        if (truncated!.decodedValue.kind !== 'unparsed') throw new Error('unreachable');
        expect(truncated!.decodedValue.reason).toBe('truncated');
        // No region overruns the buffer
        for (const r of regions) {
            expect(r.start + r.length).toBeLessThanOrEqual(bytes.length);
        }
    });

    it('read-only invariant: bytes unchanged after TokenMetadata decoding', () => {
        const data = buildTokenMetadataData({ name: 'Test', symbol: 'TST', uri: 'https://x.io' });
        const bytes = appendTlvTail(baseMint(), 1, [{ type: 19, data }]);
        const snapshot = new Uint8Array(bytes);
        Array.from(walkTokenExtensions(bytes, SPL_MINT_SIZE));
        expect(bytes).toEqual(snapshot);
    });
});
