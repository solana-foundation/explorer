import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    nextjsParameters,
    withClusterAndAccounts,
    withScrollAnchor,
    withTokenInfoBatch,
} from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { UnknownDetailsCard } from '../UnknownDetailsCard';

const sampleIx = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
    keys: [{ isSigner: true, isWritable: true, pubkey: new PublicKey('11111111111111111111111111111111') }],
    programId: new PublicKey('UnknownProgramx1111111111111111111111111111'),
});

const meta: Meta<typeof UnknownDetailsCard> = {
    component: UnknownDetailsCard,
    // First decorator is innermost — same nesting as the previous local withProviders.
    decorators: [withScrollAnchor, withTokenInfoBatch, withClusterAndAccounts, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Inspector/UnknownDetailsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { index: 0, ix: sampleIx, programName: 'Unknown' };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
