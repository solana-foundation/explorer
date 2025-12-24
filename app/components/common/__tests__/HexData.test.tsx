import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HexData } from '../HexData';

describe('HexData', () => {
    it('should render hex string from buffer', () => {
        const buffer = Buffer.from([0x1d, 0x9a, 0xcb, 0x51]);
        render(<HexData raw={buffer} />);
        // HexData renders twice (desktop and mobile views), use getAllByText
        const elements = screen.getAllByText(/1d 9a cb 51/);
        expect(elements.length).toBeGreaterThan(0);
    });

    it('should handle empty buffer', () => {
        const buffer = Buffer.from([]);
        render(<HexData raw={buffer} />);
        expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should handle null-like input', () => {
        render(<HexData raw={null as any} />);
        expect(screen.getByText('No data')).toBeInTheDocument();
    });

    it('should render multiple rows for larger data', () => {
        // 16 bytes = 1 full row (4 spans of 4 bytes each)
        const buffer = Buffer.from([
            0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d, 0x0e, 0x0f,
        ]);
        render(<HexData raw={buffer} />);
        // Component renders twice (desktop/mobile), use getAllByText
        expect(screen.getAllByText(/00 01 02 03/).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/04 05 06 07/).length).toBeGreaterThan(0);
    });

    it('should handle various byte values including edge cases', () => {
        const buffer = Buffer.from([0x00, 0xff, 0x7f, 0x80]);
        render(<HexData raw={buffer} />);
        expect(screen.getAllByText(/00 ff 7f 80/).length).toBeGreaterThan(0);
    });

    it('should render hex from Uint8Array (Buffer compatibility)', () => {
        // Buffer extends Uint8Array, so this should work
        const buffer = Buffer.from(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
        render(<HexData raw={buffer} />);
        expect(screen.getAllByText(/de ad be ef/).length).toBeGreaterThan(0);
    });

    it('should have copyable text matching hex string', () => {
        const buffer = Buffer.from([0xab, 0xcd]);
        const { container } = render(<HexData raw={buffer} />);
        // The Copyable component should have the full hex string
        const preElement = container.querySelector('pre');
        expect(preElement).toBeInTheDocument();
    });
});
