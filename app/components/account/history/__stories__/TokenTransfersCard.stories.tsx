import { mockAccountHistory, mockConfirmedSignatureInfo } from '@storybook-config/__fixtures__/account-history';
import { withHistory } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { TokenTransfersCard } from '../TokenTransfersCard';

const ADDRESS = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const meta: Meta<typeof TokenTransfersCard> = {
    component: TokenTransfersCard,
    decorators: [withHistory],
    tags: ['autodocs', 'test'],
    title: 'Components/Account/History/TokenTransfersCard',
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyHistory: Story = {
    args: { address: ADDRESS },
    parameters: {
        history: { [ADDRESS]: mockAccountHistory({ fetched: [], foundOldest: true }) },
    },
};

export const WithSignatures: Story = {
    args: { address: ADDRESS },
    parameters: {
        history: {
            [ADDRESS]: mockAccountHistory({
                fetched: [
                    mockConfirmedSignatureInfo({ blockTime: null, slot: 312_456_789 }),
                    mockConfirmedSignatureInfo({ blockTime: null, slot: 312_456_790 }),
                ],
                foundOldest: false,
            }),
        },
    },
};
