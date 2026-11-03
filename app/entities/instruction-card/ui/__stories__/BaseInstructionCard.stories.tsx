import { type ParsedInstruction, PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    nextjsParameters,
    withCluster,
    withClusterAndAccounts,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { BaseTable } from '@/app/shared/ui/Table';

import { preformatted } from '../../model/fields';
import { toInstructionNode } from '../../model/node';
import { BaseInstructionCard } from '../BaseInstructionCard';
import { InstructionFieldRows } from '../InstructionFields';

const meta = {
    args: { collapsible: false, rawSource: { kind: 'none' }, result: { err: null }, validateProgram: false },
    component: BaseInstructionCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Entities/Instruction Card/BaseInstructionCard',
} satisfies Meta<typeof BaseInstructionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleIx = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4]),
    keys: [
        {
            isSigner: true,
            isWritable: true,
            pubkey: new PublicKey('11111111111111111111111111111111'),
        },
    ],
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
});

export const Success: Story = {
    args: {
        children: (
            <BaseTable.Row>
                <BaseTable.Cell>Instruction details go here</BaseTable.Cell>
            </BaseTable.Row>
        ),
        node: toInstructionNode({ index: 0, ix: sampleIx }),
        title: 'Token Transfer',
    },
};

export const Failed: Story = {
    args: {
        children: (
            <BaseTable.Row>
                <BaseTable.Cell>Instruction details go here</BaseTable.Cell>
            </BaseTable.Row>
        ),
        node: toInstructionNode({ index: 0, ix: sampleIx }),
        result: { err: { InstructionError: [0, 'Custom'] } },
        title: 'Token Transfer',
    },
};

export const Collapsible: Story = {
    args: {
        children: (
            <BaseTable.Row>
                <BaseTable.Cell>Hidden when collapsed</BaseTable.Cell>
            </BaseTable.Row>
        ),
        collapsible: true,
        node: toInstructionNode({ index: 1, ix: sampleIx }),
        title: 'Collapsible Instruction',
    },
};

export const ValidatedProgram: Story = {
    args: {
        node: toInstructionNode({ index: 0, ix: sampleIx }),
        title: 'Inspected Instruction',
        validateProgram: true,
    },
    decorators: [withClusterAndAccounts],
};

export const PreformattedValue: Story = {
    args: {
        children: (
            <InstructionFieldRows
                fields={[preformatted('Data (UTF-8)', ['first line', 'second line', 'third line'])]}
            />
        ),
        node: toInstructionNode({ index: 0, ix: sampleIx }),
        title: 'Memo',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await expectLabelOnFirstLine(
            canvas.getByText('Data (UTF-8)'),
            canvas.getByText('first line', { exact: false }),
        );
    },
};

const parsedIx = {
    parsed: { info: { lamports: 5000 }, type: 'transfer' },
    program: 'system',
    programId: new PublicKey('11111111111111111111111111111111'),
} satisfies ParsedInstruction;

export const RawParsedInstruction: Story = {
    args: {
        node: toInstructionNode({ index: 0, ix: parsedIx }),
        title: 'System Program: Transfer',
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        await expectLabelOnFirstLine(
            canvas.getByText('Instruction Data'),
            canvas.getByText('"info"', { exact: false }),
        );
        await expect(getComputedStyle(canvas.getByText('(JSON)')).color).toBe(
            getComputedStyle(canvas.getByText('Instruction Data')).color,
        );
    },
};

async function expectLabelOnFirstLine(label: HTMLElement, value: HTMLElement): Promise<void> {
    const labelLine = firstLine(label);
    const valueLine = firstLine(value);
    const middle = labelLine.top + labelLine.height / 2;

    await expect(middle).toBeGreaterThan(valueLine.top);
    await expect(middle).toBeLessThan(valueLine.bottom);
}

function firstLine(element: HTMLElement): DOMRect {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getClientRects()[0];
}
