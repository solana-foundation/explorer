import { nextjsParameters, withClusterAccountsAndTokenInfo } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { ALWAYS_CLAIM_START_LOCK, PAUSED_LOCK, TEAM_LOCK } from '../../__tests__/__fixtures__/lock-accounts';
import { readVestingLock } from '../../lib/read-vesting-lock';
import { BaseVestingLockRows } from '../BaseVestingLockRows';

const meta = {
    component: BaseVestingLockRows,
    decorators: [withClusterAccountsAndTokenInfo],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/GenesisVesting/BaseVestingLockRows',
} satisfies Meta<typeof BaseVestingLockRows>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Vesting: Story = {
    args: { decimals: 6, lock: decode(TEAM_LOCK.base64, 1_791_448_312) },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('150,000,000 (37.50%)')).toBeInTheDocument();
    },
};

export const AfterPause: Story = {
    args: { decimals: 6, lock: decode(PAUSED_LOCK.base64, 1_791_402_130) },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Paused For')).toBeInTheDocument();
    },
};

// Creation time of the devnet token GVEXP, which holds ALWAYS_CLAIM_START_LOCK.
const GVEXP_CREATED = 1_793_216_025;

export const AlwaysClaimStart: Story = {
    args: { decimals: 6, lock: decode(ALWAYS_CLAIM_START_LOCK.base64, GVEXP_CREATED + 86_400) },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('Always')).toBeInTheDocument();
    },
};

function decode(base64: string, now: number) {
    const lock = readVestingLock(new Uint8Array(Buffer.from(base64, 'base64')), now);
    if (!lock) throw new Error('fixture did not decode');
    return lock;
}
