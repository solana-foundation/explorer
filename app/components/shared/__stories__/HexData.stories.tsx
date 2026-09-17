import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { HexData } from '../HexData';

const meta = {
    component: HexData,
    tags: ['autodocs', 'test'],
    title: 'Shared/HexData',
} satisfies Meta<typeof HexData>;

export default meta;
type Story = StoryObj<typeof meta>;

// ── Shared data ──────────────────────────────────────────────────────

const shortData = new Uint8Array([0x03, 0xe8, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
const multiRowData = new Uint8Array(Array.from({ length: 32 }, (_, i) => i));

export const Default: Story = {
    args: { align: 'start', raw: multiRowData },
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
