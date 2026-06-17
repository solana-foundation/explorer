import { Account, type State } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { nextjsParameters, withAccountsState } from '@storybook-config/decorators';
import { INITIAL_VIEWPORTS, withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { fromBase64 } from '@/app/shared/lib/bytes';
import { MAINNET_BETA_URL } from '@/app/utils/cluster';

import { AttestationDataCard } from '../sas/AttestationDataCard';
import attestationFixture from './mocks/bluprynt-attestation.json';
import schemaFixture from './mocks/bluprynt-schema.json';

// Known: switching between Mobile/Tablet variants has a brief lag from viewport addon iframe resize + remount.
type FixtureAccount = {
    address: string;
    info: { data: [string, 'base64']; executable: boolean; lamports: number; owner: string; space: number };
};

function buildAccount(fixture: FixtureAccount): Account {
    return {
        data: { raw: fromBase64(fixture.info.data[0]) },
        executable: fixture.info.executable,
        lamports: fixture.info.lamports,
        owner: new PublicKey(fixture.info.owner),
        pubkey: new PublicKey(fixture.address),
        space: fixture.info.space,
    };
}

const schemaAccount = buildAccount(schemaFixture as unknown as FixtureAccount);
const attestationAccount = buildAccount(attestationFixture as unknown as FixtureAccount);

const stateWithSchema: State = {
    entries: {
        [schemaAccount.pubkey.toBase58()]: { data: schemaAccount, status: FetchStatus.Fetched },
    },
    url: MAINNET_BETA_URL,
};

function onNotFound(): never {
    throw new Error('Fixture failed to decode — check the captured account bytes.');
}

const meta = {
    component: AttestationDataCard,
    decorators: [withViewportFromGlobal, withAccountsState(stateWithSchema)],
    parameters: {
        ...nextjsParameters,
        viewport: { options: INITIAL_VIEWPORTS },
    },
    tags: ['autodocs', 'test'],
    title: 'Components/Account/AttestationDataCard@Media',
} satisfies Meta<typeof AttestationDataCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = { account: attestationAccount, onNotFound };

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
