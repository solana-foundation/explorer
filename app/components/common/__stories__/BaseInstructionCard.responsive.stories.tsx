import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { nextjsParameters, withCluster, withScrollAnchor, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { BaseTable } from '@/app/shared/ui/Table';

import { BaseInstructionCard } from '../BaseInstructionCard';

const sampleIx = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4]),
    keys: [{ isSigner: true, isWritable: true, pubkey: new PublicKey('11111111111111111111111111111111') }],
    programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
});

const meta: Meta<typeof BaseInstructionCard> = {
    component: BaseInstructionCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Common/BaseInstructionCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    children: (
        <BaseTable.Row>
            <BaseTable.Cell>Instruction details go here</BaseTable.Cell>
        </BaseTable.Row>
    ),
    index: 0,
    ix: sampleIx,
    result: { err: null },
    title: 'Token Transfer',
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
