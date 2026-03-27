import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';

import { HexData } from '../HexData';

const meta = {
    component: HexData,
    parameters: { layout: 'padded' },
    tags: ['autodocs', 'test'],
    title: 'Shared/HexData',
} satisfies Meta<typeof HexData>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Full mode ────────────────────────────────────────────────────────

// Short data fits in a single row — one primary-colored span
const shortData = new Uint8Array([0x03, 0xe8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

export const FullShort: Story = {
    args: { raw: shortData },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Each span contains up to 4 space-separated pairs
        await expect(canvas.getAllByText('03 e8 00 00').length).toBeGreaterThan(0);
    },
};

// Multi-row data with alternating color spans
const multiRowData = new Uint8Array(Array.from({ length: 32 }, (_, i) => i));

export const FullMultiRow: Story = {
    args: { raw: multiRowData },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Primary span (first 4 bytes)
        await expect(canvas.getAllByText('00 01 02 03').length).toBeGreaterThan(0);
        // Secondary span (next 4 bytes)
        await expect(canvas.getAllByText('04 05 06 07').length).toBeGreaterThan(0);
        // Second row starts
        await expect(canvas.getAllByText('10 11 12 13').length).toBeGreaterThan(0);
    },
};

// Empty data shows "No data"
export const Empty: Story = {
    args: { raw: new Uint8Array(0) },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('No data')).toBeInTheDocument();
    },
};

// ── Truncated mode ───────────────────────────────────────────────────

// Short data in truncate mode — no ellipsis
const truncateShortData = new Uint8Array([0xfe, 0xab, 0xcd]);

export const TruncatedShort: Story = {
    args: { raw: truncateShortData, truncate: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('fe ab cd')).toBeInTheDocument();
        // No byte count shown for short data
        // eslint-disable-next-line no-restricted-syntax -- Testing Library partial text match requires regexp
        expect(canvas.queryByText(/bytes/)).toBeNull();
    },
};

// Long data in truncate mode — ellipsis + byte count
const truncateLongData = new Uint8Array(Array.from({ length: 67 }, (_, i) => i));

export const TruncatedLong: Story = {
    args: { raw: truncateLongData, truncate: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // Head spans (4 bytes each, alternating color)
        await expect(canvas.getAllByText('00 01 02 03').length).toBeGreaterThan(0);
        await expect(canvas.getAllByText('04 05 06 07').length).toBeGreaterThan(0);
        // Ellipsis
        // eslint-disable-next-line no-restricted-syntax -- Testing Library partial text match requires regexp
        await expect(canvas.getByText(/\u2026/)).toBeInTheDocument();
        // Byte count
        await expect(canvas.getByText('(67 bytes)')).toBeInTheDocument();
    },
};

// Exactly at threshold (16 bytes) — no truncation
const atThreshold = new Uint8Array(Array.from({ length: 16 }, (_, i) => i + 0xa0));

export const TruncatedAtThreshold: Story = {
    args: { raw: atThreshold, truncate: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        // All bytes shown in colored spans, no ellipsis or byte count
        await expect(canvas.getAllByText('a0 a1 a2 a3').length).toBeGreaterThan(0);
        await expect(canvas.getAllByText('ac ad ae af').length).toBeGreaterThan(0);
        // eslint-disable-next-line no-restricted-syntax -- Testing Library partial text match requires regexp
        expect(canvas.queryByText(/\u2026/)).toBeNull();
        // eslint-disable-next-line no-restricted-syntax -- Testing Library partial text match requires regexp
        expect(canvas.queryByText(/bytes/)).toBeNull();
    },
};

// Inverted: first span greenish, second white
export const TruncatedInverted: Story = {
    args: { inverted: true, raw: truncateLongData, truncate: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByText('00 01 02 03').length).toBeGreaterThan(0);
        await expect(canvas.getByText('(67 bytes)')).toBeInTheDocument();
    },
};
