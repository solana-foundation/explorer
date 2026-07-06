import { toParsedInstruction } from '@entities/instruction-parser';
import { PublicKey, type TransactionInstruction } from '@solana/web3.js';
import {
    nextjsParameters,
    withCluster,
    withMockTransactions,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { toKitInstruction } from '@/app/shared/lib/web3js-compat';

import { LIGHTHOUSE_ADDRESS, LIGHTHOUSE_PROGRAM_LABEL } from '../../lib/constants';
import { parseLighthouseInstruction } from '../../lib/lighthouse-parser';
import { LighthouseDetailsCard } from '../LighthouseDetailsCard';

const raw = {
    data: Buffer.from([5, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    keys: [
        {
            isSigner: false,
            isWritable: false,
            pubkey: new PublicKey('AUuYypaXez7kXWWWYecmsb89prMCnba6g2tBWm3BxKQV'),
        },
    ],
    programId: new PublicKey(LIGHTHOUSE_ADDRESS),
} as unknown as TransactionInstruction;

const parsed = parseLighthouseInstruction(toKitInstruction(raw));
if (!parsed) throw new Error('fixture failed to parse as a Lighthouse instruction');

const args = {
    childIndex: undefined,
    index: 0,
    innerCards: undefined,
    ix: toParsedInstruction(parsed, LIGHTHOUSE_PROGRAM_LABEL, raw.programId),
    raw,
    result: { err: null },
};

const meta: Meta<typeof LighthouseDetailsCard> = {
    component: LighthouseDetailsCard,
    decorators: [withCluster, withScrollAnchor, withTokenInfoBatch, withMockTransactions, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Instruction/LighthouseDetailsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
