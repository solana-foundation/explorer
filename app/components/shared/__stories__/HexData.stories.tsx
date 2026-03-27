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

// ── Shared data ──────────────────────────────────────────────────────

const shortData = new Uint8Array([0x03, 0xe8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
const multiRowData = new Uint8Array(Array.from({ length: 32 }, (_, i) => i));
const truncateShortData = new Uint8Array([0xfe, 0xab, 0xcd]);
const truncateLongData = new Uint8Array(Array.from({ length: 67 }, (_, i) => i));
const atThresholdData = new Uint8Array(Array.from({ length: 16 }, (_, i) => i + 0xa0));

// Centered default for autodocs preview
export const Default: Story = {
    args: { align: 'start', raw: multiRowData },
    parameters: { layout: 'centered' },
};

// ── Empty ────────────────────────────────────────────────────────────

export const Empty: Story = {
    args: { raw: new Uint8Array(0) },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('No data')).toBeInTheDocument();
    },
};

// ── Full mode ────────────────────────────────────────────────────────

export const FullShort: Story = {
    args: { align: 'start', raw: shortData },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByText('03 e8 00 00').length).toBeGreaterThan(0);
    },
};

export const FullMultiRow: Story = {
    args: { align: 'start', raw: multiRowData },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByText('00 01 02 03').length).toBeGreaterThan(0);
        await expect(canvas.getAllByText('04 05 06 07').length).toBeGreaterThan(0);
        await expect(canvas.getAllByText('10 11 12 13').length).toBeGreaterThan(0);
    },
};

// Legacy right-aligned (align="end", the default prop value)
export const FullLegacyAligned: Story = {
    args: { raw: multiRowData },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByText('00 01 02 03').length).toBeGreaterThan(0);
    },
};

// ── Truncated mode ───────────────────────────────────────────────────

export const TruncatedShort: Story = {
    args: { raw: truncateShortData, truncate: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('fe ab cd')).toBeInTheDocument();
        // eslint-disable-next-line no-restricted-syntax -- Testing Library partial text match requires regexp
        expect(canvas.queryByText(/bytes/)).toBeNull();
    },
};

export const TruncatedLong: Story = {
    args: { raw: truncateLongData, truncate: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByText('00 01 02 03').length).toBeGreaterThan(0);
        await expect(canvas.getAllByText('04 05 06 07').length).toBeGreaterThan(0);
        // eslint-disable-next-line no-restricted-syntax -- Testing Library partial text match requires regexp
        await expect(canvas.getByText(/\u2026/)).toBeInTheDocument();
        await expect(canvas.getByText('(67 bytes)')).toBeInTheDocument();
    },
};

export const TruncatedAtThreshold: Story = {
    args: { raw: atThresholdData, truncate: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByText('a0 a1 a2 a3').length).toBeGreaterThan(0);
        await expect(canvas.getAllByText('ac ad ae af').length).toBeGreaterThan(0);
        // eslint-disable-next-line no-restricted-syntax -- Testing Library partial text match requires regexp
        expect(canvas.queryByText(/\u2026/)).toBeNull();
        // eslint-disable-next-line no-restricted-syntax -- Testing Library partial text match requires regexp
        expect(canvas.queryByText(/bytes/)).toBeNull();
    },
};

export const TruncatedInverted: Story = {
    args: { inverted: true, raw: truncateLongData, truncate: true },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        await expect(canvas.getAllByText('00 01 02 03').length).toBeGreaterThan(0);
        await expect(canvas.getByText('(67 bytes)')).toBeInTheDocument();
    },
};
