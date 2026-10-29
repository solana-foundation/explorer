import { nextjsParameters, withClusterAccountsAndTokenInfo } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { ADVISORS_LOCK, CANCELLED_LOCK, MAINNET_LOCK, TEAM_LOCK } from '../../__tests__/__fixtures__/lock-accounts';
import { readVestingLock } from '../../lib/read-vesting-lock';
import { BaseTokenVesting } from '../BaseTokenVesting';

// "Cliff + 1d" in genesis-vesting-kit docs/test-token.md.
const TEST_TOKEN_NOW = 1_791_401_512 + 3_600 + 86_400;

const meta = {
    component: BaseTokenVesting,
    decorators: [withClusterAccountsAndTokenInfo],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/GenesisVesting/BaseTokenVesting',
} satisfies Meta<typeof BaseTokenVesting>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CliffAndLinearLocks: Story = {
    args: {
        decimals: 6,
        locks: [lock(TEAM_LOCK, TEST_TOKEN_NOW), lock(ADVISORS_LOCK, TEST_TOKEN_NOW)],
        supply: 1_000_000_000_000_000n,
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        await expect(canvas.getByText('628,571,428.571429')).toBeInTheDocument();
    },
};

export const ManyLocks: Story = {
    args: {
        decimals: 6,
        locks: [TEAM_LOCK, ADVISORS_LOCK, CANCELLED_LOCK, MAINNET_LOCK].map(fixture => lock(fixture, TEST_TOKEN_NOW)),
        supply: 2_000_000_000_000_000n,
    },
    async play({ canvasElement }) {
        const canvas = within(canvasElement);
        await expect(canvas.getByRole('heading', { name: 'Vesting Locks' })).toBeInTheDocument();
    },
};

function lock(fixture: { address: string; base64: string }, now: number) {
    const decoded = readVestingLock(new Uint8Array(Buffer.from(fixture.base64, 'base64')), now);
    if (!decoded) throw new Error('fixture did not decode');
    return { address: fixture.address as never, lock: decoded };
}
