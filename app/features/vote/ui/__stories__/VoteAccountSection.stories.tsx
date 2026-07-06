import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { withMockRpc } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { VoteAccountSection } from '../VoteAccountSection';
import { accountFixture, BASE_SLOT, voteAccountFixture, voteAccountV4Fixture } from './fixtures';

const meta = {
    component: VoteAccountSection,
    decorators: [withMockRpc, withClusterAndAccounts, withTokenInfoBatch],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Features/Vote/VoteAccountSection',
} satisfies Meta<typeof VoteAccountSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const votes = [{ confirmationCount: 31, slot: BASE_SLOT }];

export const PreV4: Story = {
    args: {
        account: accountFixture(),
        voteAccount: voteAccountFixture(votes),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Vote Account')).toBeInTheDocument();
        expect(canvas.getByText('Authorized Withdrawer')).toBeInTheDocument();
        expect(canvas.getByText('5%')).toBeInTheDocument();
        // SIMD-0185 rows only render when the node emits vote state v4
        expect(canvas.queryByText('Inflation Rewards Commission')).not.toBeInTheDocument();
        expect(canvas.queryByText('Pending Delegator Rewards (SOL)')).not.toBeInTheDocument();
    },
};

export const V4: Story = {
    args: {
        account: accountFixture(),
        voteAccount: voteAccountV4Fixture(votes),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Inflation Rewards Commission')).toBeInTheDocument();
        expect(canvas.getByText('Block Revenue Commission')).toBeInTheDocument();
        expect(canvas.getByText('100%')).toBeInTheDocument();
        expect(canvas.getByText('Pending Delegator Rewards (SOL)')).toBeInTheDocument();
    },
};

export const MultipleAuthorizedVoters: Story = {
    // Same voter across consecutive epochs — the shape that exposed the duplicate React key bug.
    args: {
        account: accountFixture(),
        voteAccount: (() => {
            const voteAccount = voteAccountFixture(votes);
            const voter = voteAccount.info.authorizedVoters[0].authorizedVoter;
            voteAccount.info.authorizedVoters = [700, 701, 702].map(epoch => ({ authorizedVoter: voter, epoch }));
            return voteAccount;
        })(),
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        expect(canvas.getByText('Authorized Voters')).toBeInTheDocument();
    },
};
