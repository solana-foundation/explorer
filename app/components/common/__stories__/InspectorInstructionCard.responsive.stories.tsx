import { ScrollAnchorProvider } from '@providers/scroll-anchor';
import { type ParsedInstruction, PublicKey, type VersionedMessage } from '@solana/web3.js';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { MockTokenInfoBatchProvider } from '@storybook-config/__mocks__/MockTokenInfoBatchProvider';
import { nextjsParameters } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { InspectorInstructionCard } from '../InspectorInstructionCard';

const withInspectorProviders: Decorator = Story => (
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

const programId = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

const parsedIx: ParsedInstruction = {
    parsed: {
        info: {
            destination: '8Vw25ZackDzaJzzBBqcgcpDsCsDfRSkMGgwFQ3gbReWF',
            lamports: 1_000_000_000,
            source: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
        },
        type: 'transfer',
    },
    program: 'system',
    programId,
} as any;

const message = {} as VersionedMessage;

const meta: Meta<typeof InspectorInstructionCard> = {
    component: InspectorInstructionCard,
    decorators: [withInspectorProviders, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Common/InspectorInstructionCard/Responsive',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    children: (
        <tr>
            <td>Decoded instruction details</td>
        </tr>
    ),
    index: 0,
    ix: parsedIx,
    message,
    result: { err: null },
    title: 'System Transfer',
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
