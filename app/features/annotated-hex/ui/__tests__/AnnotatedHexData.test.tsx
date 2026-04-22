import { render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { buildSplMintRegions, SPL_MINT_SIZE } from '../../model/spl-token';
import { AnnotatedHexData, TooltipBody } from '../AnnotatedHexData';

// Radix Tooltip pulls in ResizeObserver + DOMRect via @radix-ui/react-use-size; jsdom lacks both.
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
    bytes.set(new Uint8Array(32).fill(7), 4);
    view.setUint32(0, 1, true);
    view.setBigUint64(36, 1_000_000n, true);
    bytes[44] = 6;
    bytes[45] = 1;
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

    it('renders the grid with APG role + a11y attributes', () => {
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

        for (let i = 4; i < 36; i++) {
            expect(screen.getByTestId(`annotated-cell-${i}`)).toHaveAttribute('data-region-id', 'mint.mintAuthority');
        }
    });

    it('only the region-start segment is a tab stop; other segments of the same region are -1', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        render(<AnnotatedHexData raw={bytes} regions={regions} />);

        // mint.mintAuthority starts at byte 4 → first segment trigger at offset 4 gets tabIndex=0
        expect(screen.getByTestId('annotated-segment-4')).toHaveAttribute('tabindex', '0');
        // mint.mintAuthority spills into the next row starting at offset 16 → same region, not the start → -1
        expect(screen.getByTestId('annotated-segment-16')).toHaveAttribute('tabindex', '-1');
        // mint.supply starts at byte 36 — different region, its first segment is a tab stop
        expect(screen.getByTestId('annotated-segment-36')).toHaveAttribute('tabindex', '0');
    });

    it('TooltipBody renders pubkey DecodedValue as base58 <code>', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        const mintAuthRegion = regions.find(r => r.id === 'mint.mintAuthority')!;
        render(<TooltipBody region={mintAuthRegion} />);

        expect(screen.getByTestId('annotated-tooltip-mint.mintAuthority')).toHaveTextContent('Mint Authority');
        const text = screen.getByTestId('decoded-pubkey').textContent ?? '';
        expect(text.length).toBeGreaterThanOrEqual(32);
        expect(text.length).toBeLessThanOrEqual(44);
        // eslint-disable-next-line no-restricted-syntax -- base58 alphabet validation
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
        render(<TooltipBody region={supplyRegion} />);

        const tooltip = screen.getByTestId('annotated-tooltip-mint.supply');
        expect(tooltip).toHaveTextContent('Supply');
        expect(tooltip).toHaveTextContent('1234567890');
        expect(tooltip).toHaveTextContent('1234.567890 with 6 decimals');
    });

    it('TooltipBody renders isNone pubkey as "None" span, not a code element', () => {
        const bytes = new Uint8Array(SPL_MINT_SIZE);
        bytes[45] = 1;
        const regions = buildSplMintRegions(bytes, undefined);
        const authRegion = regions.find(r => r.id === 'mint.mintAuthority')!;
        render(<TooltipBody region={authRegion} />);

        expect(screen.getByTestId('annotated-tooltip-mint.mintAuthority')).toHaveTextContent('None');
        expect(screen.getByTestId('decoded-pubkey-none')).toBeInTheDocument();
        expect(screen.queryByTestId('decoded-pubkey')).not.toBeInTheDocument();
    });

    it('TooltipBody shows the byte range', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        const supplyRegion = regions.find(r => r.id === 'mint.supply')!;
        render(<TooltipBody region={supplyRegion} />);

        const tooltip = screen.getByTestId('annotated-tooltip-mint.supply');
        // eslint-disable-next-line no-restricted-syntax -- verify byte-range summary
        expect(tooltip).toHaveTextContent(/bytes \[36\.\.44\]/);
        expect(tooltip).toHaveTextContent('8 bytes');
    });

    it('does not render <a> elements for text DecodedValues', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        render(<AnnotatedHexData raw={bytes} regions={regions} />);
        expect(screen.queryAllByRole('link')).toHaveLength(0);
    });

    it('renders the legend with one chip per unique region', () => {
        const bytes = buildBytes();
        const regions = buildSplMintRegions(bytes, undefined);
        render(<AnnotatedHexData raw={bytes} regions={regions} />);

        expect(screen.getByTestId('annotated-hex-legend')).toBeInTheDocument();
        expect(screen.getByTestId('annotated-hex-legend-mint.mintAuthority')).toBeInTheDocument();
        expect(screen.getByTestId('annotated-hex-legend-mint.supply')).toBeInTheDocument();
        expect(screen.getByTestId('annotated-hex-legend-mint.freezeAuthority')).toBeInTheDocument();
    });
});
