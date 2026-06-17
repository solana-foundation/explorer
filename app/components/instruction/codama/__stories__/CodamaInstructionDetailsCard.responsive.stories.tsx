import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
    nextjsParameters,
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { CodamaInstructionCard } from '../CodamaInstructionDetailsCard';

const sampleIx = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
    keys: [{ isSigner: true, isWritable: true, pubkey: new PublicKey('11111111111111111111111111111111') }],
    programId: new PublicKey('CodamaProgramx111111111111111111111111111x1'),
});

const fallbackParsedIx = { path: [{ kind: 'unknownNode' }] } as any;

const meta: Meta<typeof CodamaInstructionCard> = {
    component: CodamaInstructionCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/CodamaInstructionDetailsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { index: 0, ix: sampleIx, parsedIx: fallbackParsedIx, result: { err: null } };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
