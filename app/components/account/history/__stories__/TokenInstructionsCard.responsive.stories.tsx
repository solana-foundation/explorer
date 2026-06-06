import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { mockAccountHistory, mockConfirmedSignatureInfo } from '@storybook-config/__fixtures__/account-history';
import { MockAccountsProvider } from '@storybook-config/__mocks__/MockAccountsProvider';
import { MockClusterProvider as ClusterProvider } from '@storybook-config/__mocks__/MockClusterProvider';
import { MockHistoryProvider } from '@storybook-config/__mocks__/MockHistoryProvider';
import { nextjsParameters } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';

import { TokenInstructionsCard } from '../TokenInstructionsCard';

const ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const withHistory: Decorator = Story => (
    <ClusterProvider>
        <MockAccountsProvider>
            <MockHistoryProvider
                history={{
                    [ADDRESS]: mockAccountHistory({
                        fetched: [mockConfirmedSignatureInfo({ blockTime: null, slot: 312_456_789 })],
                        foundOldest: true,
                    }),
                }}
            >
                <Story />
            </MockHistoryProvider>
        </MockAccountsProvider>
    </ClusterProvider>
);

const meta: Meta<typeof TokenInstructionsCard> = {
    component: TokenInstructionsCard,
    decorators: [withHistory, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/History/TokenInstructionsCard/Responsive',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { address: ADDRESS };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
