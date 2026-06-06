import { ScrollAnchorProvider } from '@providers/scroll-anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { MockTokenInfoBatchProvider } from '@storybook-config/__mocks__/MockTokenInfoBatchProvider';
import { nextjsParameters } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { UnknownDetailsCard } from '../UnknownDetailsCard';

const sampleIx = new TransactionInstruction({
    data: Buffer.from([1, 2, 3, 4, 5, 6, 7, 8]),
    keys: [{ isSigner: true, isWritable: true, pubkey: new PublicKey('11111111111111111111111111111111') }],
    programId: new PublicKey('UnknownProgramx1111111111111111111111111111'),
});

const withProviders: Decorator = Story => (
    <MockClusterProvider>
        <MockAccountsProvider>
            <MockTokenInfoBatchProvider>
                <ScrollAnchorProvider>
                    <Story />
                </ScrollAnchorProvider>
            </MockTokenInfoBatchProvider>
        </MockAccountsProvider>
    </MockClusterProvider>
);

const meta: Meta<typeof UnknownDetailsCard> = {
    component: UnknownDetailsCard,
    decorators: [withProviders, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Inspector/UnknownDetailsCard/Responsive',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { index: 0, ix: sampleIx, programName: 'Unknown' };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
