import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { nextjsParameters, withCluster } from '@storybook-config/decorators';

import { AnchorAccountCard } from '../AnchorAccountCard';

const sampleAccount: Account = {
    data: { raw: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]) },
    executable: false,
    lamports: 1_000_000_000,
    owner: new PublicKey('11111111111111111111111111111111'),
    pubkey: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    space: 9,
};

// Without an Anchor IDL the card renders the ErrorCard fallback. Rendering with a real
// decoded account requires a working Anchor IDL fetch, which isn't available in Storybook.
const meta = {
    component: AnchorAccountCard,
    decorators: [withCluster],
    parameters: nextjsParameters,
    tags: ['autodocs', 'test'],
    title: 'Components/Account/AnchorAccountCard',
} satisfies Meta<typeof AnchorAccountCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoIdl: Story = {
    args: { account: sampleAccount },
};
