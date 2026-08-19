import { DEFAULT_SIGNATURE } from '@__fixtures__/gen';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import { mockVersionedMessage } from '@storybook-config/__fixtures__/messages';
import { nextjsParameters, withCluster, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { TransactionSignatures } from '../SignaturesCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
const SIGNER_2 = new PublicKey(TOKEN_PROGRAM_ADDRESS);
const BOGUS_SIGNATURE = DEFAULT_SIGNATURE;

const baseMessage = mockVersionedMessage({
    header: {
        numReadonlySignedAccounts: 0,
        numReadonlyUnsignedAccounts: 0,
        numRequiredSignatures: 2,
    },
    staticAccountKeys: [PublicKey.default, SIGNER_2],
});

const rawMessage = new Uint8Array(64);

const meta = {
    component: TransactionSignatures,
    decorators: [withViewportFromGlobal, withCluster, withTokenInfoBatch],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Inspector/SignaturesCard@Media',
} satisfies Meta<typeof TransactionSignatures>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    message: baseMessage,
    rawMessage,
    signatures: [BOGUS_SIGNATURE, BOGUS_SIGNATURE],
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
