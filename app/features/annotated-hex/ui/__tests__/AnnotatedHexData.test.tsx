import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { buildSplMintRegions, SPL_MINT_SIZE } from '../../model/spl-token';
import { AnnotatedHexData, TooltipBody } from '../AnnotatedHexData';

// jsdom doesn't implement ResizeObserver; Radix Tooltip uses it internally.
// Polyfill with a no-op — tooltip positioning is out of scope for these tests.
beforeAll(() => {
    if (typeof (globalThis as Record<string, unknown>).ResizeObserver === 'undefined') {
        (globalThis as Record<string, unknown>).ResizeObserver = class {
            observe() {}
            unobserve() {}
            disconnect() {}
        };
    }
    if (typeof (globalThis as Record<string, unknown>).DOMRect === 'undefined') {
        (globalThis as Record<string, unknown>).DOMRect = class {
            bottom = 0;
            height = 0;
            left = 0;
            right = 0;
            top = 0;
            width = 0;
            x = 0;
            y = 0;
            static fromRect() {
                return new this();
            }
            toJSON() {
                return this;
            }
        };
    }
});

function buildBytes(): Uint8Array {
    const bytes = new Uint8Array(SPL_MINT_SIZE);
    const view = new DataView(bytes.buffer);
    bytes.set(new Uint8Array(32).fill(7), 4); // mintAuthority pubkey
    view.setUint32(0, 1, true); // mintAuthority COption tag = Some
    view.setBigUint64(36, 1_000_000n, true);
    bytes[44] = 6; // decimals
    bytes[45] = 1; // isInitialized
    return bytes;
}

describe('AnnotatedHexData', () => {
    it('renders one cell per byte', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        render(<AnnotatedHexData raw={bytes} regions={regions} />);

        for (let i = 0; i < bytes.length; i++) {
            expect(screen.getByTestId(`annotated-cell-${i}`)).toBeInTheDocument();
        }
    });

    it('renders the grid with the APG grid role and a11y attributes', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        render(<AnnotatedHexData raw={bytes} regions={regions} />);

        const grid = screen.getByTestId('annotated-hex-grid');
        expect(grid).toHaveAttribute('role', 'grid');
        expect(grid).toHaveAttribute('aria-label', 'Account hex dump');
        expect(grid).toHaveAttribute('aria-colcount', '16');
    });

    it('cells within a region share a region id via data-region-id', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        render(<AnnotatedHexData raw={bytes} regions={regions} />);

        // mintAuthority spans bytes 4..36 (32 bytes)
        for (let i = 4; i < 36; i++) {
            expect(screen.getByTestId(`annotated-cell-${i}`)).toHaveAttribute('data-region-id', 'mint.mintAuthority');
        }
    });

    it('only the first cell of a region is a tab stop (tabIndex=0)', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        render(<AnnotatedHexData raw={bytes} regions={regions} />);

        // mint.mintAuthorityOption starts at 0
        expect(screen.getByTestId('annotated-cell-0')).toHaveAttribute('tabindex', '0');
        // Inside the same region (bytes 1, 2, 3): tabIndex=-1
        expect(screen.getByTestId('annotated-cell-1')).toHaveAttribute('tabindex', '-1');
        // mint.mintAuthority starts at 4 — new region, tabIndex=0
        expect(screen.getByTestId('annotated-cell-4')).toHaveAttribute('tabindex', '0');
        expect(screen.getByTestId('annotated-cell-5')).toHaveAttribute('tabindex', '-1');
    });

    // Note: Radix Tooltip open/close is verified in Storybook + manual browser testing
    // rather than via user.hover() in jsdom — Radix uses pointer events + layout APIs
    // that are notoriously flaky under jsdom's simulation. Here we test the TooltipBody
    // render in isolation, which covers all the content logic without Radix internals.

    it('TooltipBody renders pubkey DecodedValue as base58 <code>', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        const mintAuthRegion = regions.find(r => r.id === 'mint.mintAuthority')!;
        render(<TooltipBody region={mintAuthRegion} offset={4} byte={7} />);

        expect(screen.getByTestId('annotated-tooltip-mint.mintAuthority')).toHaveTextContent('Mint Authority');
        const pubkeyCode = screen.getByTestId('decoded-pubkey');
        const text = pubkeyCode.textContent ?? '';
        // Solana pubkeys base58-encode to 32-44 chars (leading zero bytes shorten the result)
        expect(text.length).toBeGreaterThanOrEqual(32);
        expect(text.length).toBeLessThanOrEqual(44);
        // eslint-disable-next-line no-restricted-syntax -- base58 alphabet character set validation
        expect(text).toMatch(/^[1-9A-HJ-NP-Za-km-z]+$/);
    });

    it('TooltipBody renders amount DecodedValue as raw + ui-scaled', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, {
            decimals: 6,
            freezeAuthority: null,
            isInitialized: true,
            mintAuthority: null,
            supply: '1234567890',
        });
        const supplyRegion = regions.find(r => r.id === 'mint.supply')!;
        render(<TooltipBody region={supplyRegion} offset={36} byte={0x00} />);

        const tooltip = screen.getByTestId('annotated-tooltip-mint.supply');
        expect(tooltip).toHaveTextContent('Supply');
        expect(tooltip).toHaveTextContent('1234567890');
        expect(tooltip).toHaveTextContent('1234.567890 with 6 decimals');
    });

    it('TooltipBody renders isNone pubkey as italic "None"', () => {
        // Bytes with COption tag=0 and all-zero pubkey
        const bytes = new Uint8Array(SPL_MINT_SIZE);
        bytes[45] = 1; // isInitialized to dodge state=0 label gotcha
        const regions = buildSplMintRegions(bytes, undefined);
        const authRegion = regions.find(r => r.id === 'mint.mintAuthority')!;
        render(<TooltipBody region={authRegion} offset={4} byte={0} />);

        expect(screen.getByTestId('annotated-tooltip-mint.mintAuthority')).toHaveTextContent('None');
        expect(screen.getByTestId('decoded-pubkey-none')).toBeInTheDocument();
        expect(screen.queryByTestId('decoded-pubkey')).not.toBeInTheDocument();
    });

    it('TooltipBody includes byte range + offset + byte value in small print', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        const supplyRegion = regions.find(r => r.id === 'mint.supply')!;
        render(<TooltipBody region={supplyRegion} offset={36} byte={0x40} />);

        const tooltip = screen.getByTestId('annotated-tooltip-mint.supply');
        /* eslint-disable no-restricted-syntax -- asserting specific format text in small-print metadata */
        expect(tooltip).toHaveTextContent(/bytes \[36\.\.44\]/);
        expect(tooltip).toHaveTextContent(/offset 0x0024/);
        expect(tooltip).toHaveTextContent(/byte 0x40/);
        /* eslint-enable no-restricted-syntax */
    });

    it('cells without a region render as neutral (no tooltip, no region id)', () => {
        // Give only the first field a region; bytes 36+ will have no region
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined).slice(0, 1);
        render(<AnnotatedHexData raw={bytes} regions={regions} />);

        const cell50 = screen.getByTestId('annotated-cell-50');
        expect(cell50).not.toHaveAttribute('data-region-id');
    });

    it('renders the legend with one chip per unique region', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        render(<AnnotatedHexData raw={bytes} regions={regions} />);

        expect(screen.getByTestId('annotated-hex-legend')).toBeInTheDocument();
        // 7 base mint regions → 7 legend chips
        expect(screen.getByTestId('annotated-hex-legend-mint.mintAuthority')).toBeInTheDocument();
        expect(screen.getByTestId('annotated-hex-legend-mint.supply')).toBeInTheDocument();
        expect(screen.getByTestId('annotated-hex-legend-mint.freezeAuthority')).toBeInTheDocument();
    });

    it('does not render link elements for text DecodedValues (XSS safety)', () => {
        // Even if a decoder one day produced a `text` kind with a javascript: URI,
        // the renderer uses plain text nodes — never an <a href>.
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        render(<AnnotatedHexData raw={bytes} regions={regions} />);
        expect(screen.queryAllByRole('link')).toHaveLength(0);
    });

    it('does not crash when raw.length is smaller than the largest region end (defensive)', () => {
        // buildSplMintRegions throws on truncation, so this simulates an upstream
        // that hands us bytes.length=40 with regions that claim up to 82.
        const bytes = new Uint8Array(40);
        const regions = buildSplMintRegions(new Uint8Array(82), undefined);
        expect(() => render(<AnnotatedHexData raw={bytes} regions={regions} />)).not.toThrow();
    });
});
