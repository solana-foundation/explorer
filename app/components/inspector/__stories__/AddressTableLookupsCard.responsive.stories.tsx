import type { State } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { AddressLookupTableProgram, PublicKey } from '@solana/web3.js';
import { mockVersionedMessage } from '@storybook-config/__fixtures__/messages';
import { withAccountsState, withTokenInfoBatch } from '@storybook-config/decorators';
import { withViewportFromGlobal } from '@storybook-config/responsive-decorators';
import type { Meta, StoryObj } from '@storybook-config/types';

import { MAINNET_BETA_URL } from '@/app/utils/cluster';

import { AddressTableLookupsCard } from '../AddressTableLookupsCard';

const LOOKUP_TABLE_KEY = new PublicKey('AddressLookupTab1e1111111111111111111111111');
const RESOLVED_A = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const RESOLVED_B = new PublicKey('So11111111111111111111111111111111111111112');

const message = mockVersionedMessage({
    addressTableLookups: [{ accountKey: LOOKUP_TABLE_KEY, readonlyIndexes: [1], writableIndexes: [0] }],
    header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 0, numRequiredSignatures: 0 },
    staticAccountKeys: [],
});

const resolvedState: State = {
    entries: {
        [LOOKUP_TABLE_KEY.toBase58()]: {
            data: {
                data: {
                    parsed: {
                        parsed: {
                            info: {
                                addresses: [RESOLVED_A, RESOLVED_B],
                                authority: undefined,
                                deactivationSlot: '18446744073709551615',
                                lastExtendedSlot: '0',
                                lastExtendedSlotStartIndex: 0,
                            },
                            type: 'lookupTable',
                        },
                        program: 'address-lookup-table',
                        space: 568,
                    },
                } as any,
                executable: false,
                lamports: 1_000_000_000,
                owner: AddressLookupTableProgram.programId,
                pubkey: LOOKUP_TABLE_KEY,
                space: 568,
            },
            status: FetchStatus.Fetched,
        },
    },
    url: MAINNET_BETA_URL,
};

const meta: Meta<typeof AddressTableLookupsCard> = {
    component: AddressTableLookupsCard,
    decorators: [withTokenInfoBatch, withAccountsState(resolvedState), withViewportFromGlobal],
    tags: ['autodocs', 'test'],
    title: 'Components/Inspector/AddressTableLookupsCard@Media',
};

export default meta;
type Story = StoryObj<typeof meta>;

const args = { message };

export const Mobile: Story = { args, globals: { viewport: { value: 'iphonex' } } };
export const TabletPortrait: Story = { args, globals: { viewport: { value: 'ipad' } } };
export const TabletLandscape: Story = { args, globals: { viewport: { isRotated: true, value: 'ipad' } } };
