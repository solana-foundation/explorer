/* eslint-disable no-restricted-syntax -- storybook play functions use RegExp for pattern matching */
import { makeAccount } from '@entities/account/__fixtures__/account';
import { PublicKey, VersionedMessage } from '@solana/web3.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { mockVersionedMessage } from '@storybook-config/__fixtures__/messages';
import { withAccountsState, withTokenInfoBatch } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';
import { expect, within } from 'storybook/test';

import { State } from '@/app/providers/accounts';
import { FetchStatus } from '@/app/providers/cache';
import { MAINNET_BETA_URL } from '@/app/utils/cluster';

import { AccountsCard } from '../AccountsCard';

const TOKEN_PROGRAM_PUBKEY = new PublicKey(TOKEN_PROGRAM_ADDRESS);

// Create a message without lookups
const createMessage = (): VersionedMessage => {
    const staticAccountKeys = [PublicKey.default, TOKEN_PROGRAM_PUBKEY];
    return mockVersionedMessage({
        getAccountKeys: () => ({
            accountKeysFromLookups: undefined,
            staticAccountKeys,
        }),
        header: {
            numReadonlySignedAccounts: 0,
            numReadonlyUnsignedAccounts: 1,
            numRequiredSignatures: 1,
        },
        staticAccountKeys,
    });
};

const accountsState: State = {
    entries: {
        [PublicKey.default.toBase58()]: {
            data: makeAccount({ space: 0 }),
            status: FetchStatus.Fetched,
        },
        [TOKEN_PROGRAM_ADDRESS]: {
            data: {
                data: {},
                executable: true,
                lamports: 5_000_000_000,
                owner: new PublicKey('BPFLoaderUpgradeab1e11111111111111111111111'),
                pubkey: TOKEN_PROGRAM_PUBKEY,
                space: 36,
            },
            status: FetchStatus.Fetched,
        },
    },
    url: MAINNET_BETA_URL,
};

const meta = {
    component: AccountsCard,
    decorators: [withTokenInfoBatch],
    tags: ['autodocs', 'test'],
    title: 'Components/Inspector/AccountsCard',
} satisfies Meta<typeof AccountsCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        message: createMessage(),
    },
    decorators: [withAccountsState(accountsState)],
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);

        // Should show the card header
        await expect(canvas.getByText(/Account List/)).toBeInTheDocument();

        // The fee payer (account index 0) carries Signer + Writable badges from the message header; both
        // the mobile card and the desktop row emit them, so there is at least one of each.
        await expect(canvas.getAllByText('Signer').length).toBeGreaterThan(0);
        await expect(canvas.getAllByText('Writable').length).toBeGreaterThan(0);
        await expect(canvas.getByText('Total Account Size:')).toBeInTheDocument();
        await expect(canvas.getAllByText('36 bytes').length).toBeGreaterThan(0);
    },
};
