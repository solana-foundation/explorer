import { Keypair, PublicKey } from '@solana/web3.js';
import { SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import type { Meta, StoryObj } from '@storybook/react';
import { nextjsParameters, withClusterAndAccounts, withTokenInfoBatch } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import BN from 'bn.js';

import type { SolBalanceChange } from '../../lib/types';
import { SolBalanceChangesCard } from '../SolBalanceChangesCard';

const ALICE = Keypair.generate().publicKey.toBase58();

function change(pubkey: string, delta: string, preBalance: string, postBalance: string): SolBalanceChange {
    return {
        delta: new BN(delta),
        postBalance: new BN(postBalance),
        preBalance: new BN(preBalance),
        pubkey: new PublicKey(pubkey),
    };
}

const meta: Meta<typeof SolBalanceChangesCard> = {
    component: SolBalanceChangesCard,
    decorators: [withClusterAndAccounts, withTokenInfoBatch, withViewportFromGlobal],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Features/Instruction Simulation/UI/SolBalanceChangesCard/Responsive',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = {
    balanceChanges: [
        change(ALICE, '-2000000000', '5000000000', '3000000000'),
        change(TOKEN_PROGRAM_ADDRESS, '1500000000', '1000000000', '2500000000'),
        change(SYSTEM_PROGRAM_ADDRESS, '500000000', '0', '500000000'),
    ],
};

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
