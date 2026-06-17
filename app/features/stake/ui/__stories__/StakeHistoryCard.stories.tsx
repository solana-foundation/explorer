import type { Meta, StoryObj } from '@storybook-config/types';
import type { SysvarStakeHistoryAccount } from '@validators/accounts/sysvar';
import { expect, within } from 'storybook/test';

import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '../../../../../.storybook/decorators';
import { StakeHistoryCard } from '../StakeHistoryCard';

function sysvar(entries: SysvarStakeHistoryAccount['info']): SysvarStakeHistoryAccount {
    return { info: entries, type: 'stakeHistory' };
}

const meta = {
    component: StakeHistoryCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Stake/StakeHistoryCard',
} satisfies Meta<typeof StakeHistoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEntries: Story = {
    args: {
        sysvarAccount: sysvar([
            {
                epoch: 700,
                stakeHistory: {
                    activating: 12_500_000_000,
                    deactivating: 8_300_000_000,
                    effective: 384_120_000_000_000,
                },
            },
            {
                epoch: 699,
                stakeHistory: {
                    activating: 9_700_000_000,
                    deactivating: 11_200_000_000,
                    effective: 383_400_000_000_000,
                },
            },
            {
                epoch: 698,
                stakeHistory: {
                    activating: 14_100_000_000,
                    deactivating: 6_900_000_000,
                    effective: 382_960_000_000_000,
                },
            },
        ]),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Stake History')).toBeInTheDocument();
        // Three header columns + one row per entry
        expect(canvas.getAllByText('700').length).toBeGreaterThan(0);
        expect(canvas.queryByText('No stake history found')).not.toBeInTheDocument();
    },
};

export const Empty: Story = {
    args: {
        sysvarAccount: sysvar([]),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('No stake history found')).toBeInTheDocument();
    },
};
