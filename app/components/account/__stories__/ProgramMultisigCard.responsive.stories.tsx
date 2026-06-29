import { DEFAULT_SLOT } from '@__fixtures__/gen';
import { PublicKey } from '@solana/web3.js';
import { createNextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import type { UpgradeableLoaderAccountData } from '@/app/providers/accounts';

import { ProgramMultisigCard } from '../ProgramMultisigCard';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
// Devnet short-circuits useSquadsMultisigLookup so Suspense resolves without RPC calls.
const meta = {
    component: ProgramMultisigCard,
    decorators: [withViewportFromGlobal, withClusterAndAccounts, withTokenInfoBatch],
    parameters: {
        ...createNextjsParameters({ query: { cluster: 'devnet' } }),
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/ProgramMultisigCard@Media',
} satisfies Meta<typeof ProgramMultisigCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    data: {
        parsed: {
            info: { programData: PublicKey.default },
            type: 'program',
        },
        program: 'bpf-upgradeable-loader',
        programData: {
            authority: PublicKey.default,
            data: ['', 'base64'],
            slot: DEFAULT_SLOT,
        },
    } satisfies UpgradeableLoaderAccountData,
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
