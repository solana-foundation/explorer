import { Account, DispatchContext, FetchersContext, type State, StateContext } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { ClusterProvider } from '@providers/cluster';
import { PublicKey } from '@solana/web3.js';
import type { Decorator, Meta, StoryObj } from '@storybook/react';
import { nextjsParameters } from '@storybook-config/decorators';
import React from 'react';

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

const noop = () => undefined;

// AttestationCard reads the schema account from the cache via useAccountInfo so it can
// deserialize the attestation's binary `data` field against the schema layout.
const stateWithSchema: State = {
    entries: {
        [schemaAccount.pubkey.toBase58()]: { data: schemaAccount, status: FetchStatus.Fetched },
    },
    url: MAINNET_BETA_URL,
};

function MockAccountsState({ children, state }: { children: React.ReactNode; state: State }) {
    return (
        <ClusterProvider>
            <StateContext.Provider value={state}>
                <DispatchContext.Provider value={noop}>
                    <FetchersContext.Provider
                        value={{ parsed: { fetch: noop }, raw: { fetch: noop }, skip: { fetch: noop } } as any}
                    >
                        {children}
                    </FetchersContext.Provider>
                </DispatchContext.Provider>
            </StateContext.Provider>
        </ClusterProvider>
    );
}

function onNotFound(): never {
    throw new Error('Fixture failed to decode — check the captured account bytes.');
}

const meta = {
    component: AttestationDataCard,
    parameters: nextjsParameters,
    tags: ['autodocs'],
    title: 'Components/Account/AttestationDataCard',
} satisfies Meta<typeof AttestationDataCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const WithEmptyAccounts: Decorator = Story => (
    <MockAccountsState state={{ entries: {}, url: MAINNET_BETA_URL }}>
        <Story />
    </MockAccountsState>
);

const WithSchemaInCache: Decorator = Story => (
    <MockAccountsState state={stateWithSchema}>
        <Story />
    </MockAccountsState>
);

// Schema account (decodes as SAS Schema → renders SchemaCard with the Borsh layout).
export const Schema: Story = {
    args: { account: schemaAccount, onNotFound },
    decorators: [WithEmptyAccounts],
};

// Attestation account with the schema available in the accounts cache → AttestationCard
// deserializes the attestation data using the schema's layout and renders the JSON viewer.
export const AttestationWithSchema: Story = {
    args: { account: attestationAccount, onNotFound },
    decorators: [WithSchemaInCache],
};

// Attestation account WITHOUT the schema in cache → AttestationCard falls back to the
// raw base64 view because the schema lookup is empty.
export const AttestationRawFallback: Story = {
    args: { account: attestationAccount, onNotFound },
    decorators: [WithEmptyAccounts],
};
