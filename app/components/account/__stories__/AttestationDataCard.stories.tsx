import { Account, type State } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { withAccountsState } from '@storybook-config/decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { fromBase64 } from '@/app/shared/lib/bytes';
import { MAINNET_BETA_URL } from '@/app/utils/cluster';

import { AttestationDataCard } from '../sas/AttestationDataCard';
import attestationFixture from './mocks/bluprynt-attestation.json';
import schemaFixture from './mocks/bluprynt-schema.json';

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

// AttestationCard reads the schema from useAccountInfo to deserialize attestation `data`.
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
    tags: ['autodocs', 'test'],
    title: 'Components/Account/AttestationDataCard',
} satisfies Meta<typeof AttestationDataCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const withEmptyAccounts = withAccountsState({ entries: {}, url: MAINNET_BETA_URL });

const withSchemaInCache = withAccountsState(stateWithSchema);

// Schema account (decodes as SAS Schema → renders SchemaCard with the Borsh layout).
export const Schema: Story = {
    args: { account: schemaAccount, onNotFound },
    decorators: [withEmptyAccounts],
};

// Schema in accounts cache → AttestationCard deserializes and renders the JSON viewer.
export const AttestationWithSchema: Story = {
    args: { account: attestationAccount, onNotFound },
    decorators: [withSchemaInCache],
};

// No schema in cache → AttestationCard falls back to raw base64 view.
export const AttestationRawFallback: Story = {
    args: { account: attestationAccount, onNotFound },
    decorators: [withEmptyAccounts],
};
