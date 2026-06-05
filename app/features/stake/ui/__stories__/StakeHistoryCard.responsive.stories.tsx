import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { SysvarStakeHistoryAccount } from '@validators/accounts/sysvar';

import { StakeHistoryCard } from '../StakeHistoryCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
function sysvar(entries: SysvarStakeHistoryAccount['info']): SysvarStakeHistoryAccount {
    return { info: entries, type: 'stakeHistory' };
}

const meta = {
    component: StakeHistoryCard,
    decorators: [withViewportFromGlobal, withClusterAndAccounts, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Stake/StakeHistoryCard/Responsive',
} satisfies Meta<typeof StakeHistoryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    sysvarAccount: sysvar([
        {
            epoch: 700,
            stakeHistory: { activating: 12_500_000_000, deactivating: 8_300_000_000, effective: 384_120_000_000_000 },
        },
        {
            epoch: 699,
            stakeHistory: { activating: 9_700_000_000, deactivating: 11_200_000_000, effective: 383_400_000_000_000 },
        },
        {
            epoch: 698,
            stakeHistory: { activating: 14_100_000_000, deactivating: 6_900_000_000, effective: 382_960_000_000_000 },
        },
    ]),
};

export const Mobile: Story = {
    args,
    globals: { viewport: { value: 'iphonex' } },
};

export const TabletPortrait: Story = {
    args,
    globals: { viewport: { value: 'ipad' } },
};

export const TabletLandscape: Story = {
    args,
    globals: { viewport: { isRotated: true, value: 'ipad' } },
};
