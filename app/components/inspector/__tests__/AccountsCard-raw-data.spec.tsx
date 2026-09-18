import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation');

// The accounts provider does not read an account until the cluster handshake resolves.
vi.mock('@/app/entities/cluster/api/fetch-genesis-hash', () => ({
    fetchGenesisHash: vi.fn(async () => 'genesis'),
}));

const mockGetMultipleAccounts = vi.fn();
const mockGetAccountInfo = vi.fn();

// The viewer imports getRpc from the account slice and the accounts provider imports it from the
// entity root, so both paths need the mock.
const mockRpc = () => ({
    getAccountInfo: (...args: unknown[]) => ({
        send: async () => ({ value: await mockGetAccountInfo(...args) }),
    }),
    getMultipleAccounts: (...args: unknown[]) => ({
        send: async () => ({ value: await mockGetMultipleAccounts(...args) }),
    }),
});

vi.mock('@entities/cluster/@x/account', async () => {
    const actual = await vi.importActual<typeof import('@entities/cluster/@x/account')>('@entities/cluster/@x/account');
    return { ...actual, getRpc: vi.fn(() => mockRpc()) };
});

vi.mock('@entities/cluster', async () => {
    const actual = await vi.importActual<typeof import('@entities/cluster')>('@entities/cluster');
    return { ...actual, getRpc: vi.fn(() => mockRpc()) };
});

import { Message, MessageV0, PublicKey, type VersionedMessage } from '@solana/web3.js';
import React from 'react';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { AccountsProvider, useFetchAccountInfo } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { toBase64 } from '@/app/shared/lib/bytes';

import { AccountsCard } from '../AccountsCard';

const ACCOUNT_BYTES = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
// HexData joins the pairs of a span with spaces, and renders a desktop and a mobile copy of the row.
const ACCOUNT_HEX = 'de ad be ef';

describe('inspector::AccountsCard raw data', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetMultipleAccounts.mockImplementation(async addresses => sizedAccounts(addresses));
        mockGetAccountInfo.mockResolvedValue({ data: [toBase64(ACCOUNT_BYTES), 'base64'] });
    });

    test('should read the sizes from a request that carries no account bytes', async () => {
        renderCard();

        await findRenderedSizes();

        expect(mockGetMultipleAccounts).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ dataSlice: { length: 0, offset: 0 } }),
        );
    });

    test('should read every row from one batch request', async () => {
        renderCard();

        await findRenderedSizes();

        expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(1);
    });

    test('should not request account data while the list renders', async () => {
        renderCard();

        await findRenderedSizes();

        expect(mockGetAccountInfo).not.toHaveBeenCalled();
    });

    test('should show the opened account bytes, and request only that account', async () => {
        renderCard();
        await openFirstViewer();

        expect(await screen.findAllByText(ACCOUNT_HEX)).not.toHaveLength(0);
        expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    });

    // A total assembled from the rows that answered first reads as the whole transaction's size.
    test('should hold the total back while a later batch is still in flight', async () => {
        let answerLastBatch = () => undefined as void;
        mockGetMultipleAccounts
            .mockImplementationOnce(async addresses => sizedAccounts(addresses))
            .mockImplementationOnce(
                addresses =>
                    new Promise(resolve => {
                        answerLastBatch = () => resolve(sizedAccounts(addresses));
                    }),
            );

        renderCard(overOneBatchOfAccounts(150));
        await waitForSecondBatch();
        await findRenderedSizes();

        expect(screen.queryByText('Total Account Size:')).not.toBeInTheDocument();

        answerLastBatch();

        expect(await screen.findByText('Total Account Size:')).toBeInTheDocument();
        expect(screen.getByText('600 bytes')).toBeInTheDocument();
    });

    // The rows that failed count as zero, so the rows that answered sum to a number that reads as the
    // whole transaction's size.
    test('should drop the total when a batch fails', async () => {
        mockGetMultipleAccounts
            .mockImplementationOnce(async addresses => sizedAccounts(addresses))
            .mockRejectedValueOnce(new Error('RPC unavailable'));

        renderCard(overOneBatchOfAccounts(150));
        await waitForSecondBatch();
        await findRenderedSizes();

        expect(screen.queryByText('Total Account Size:')).not.toBeInTheDocument();
    });

    test('should hold the total back until the lookup table adds its rows', async () => {
        let answerTable = () => undefined as void;
        mockGetMultipleAccounts.mockImplementation((addresses, options) => {
            if (options.encoding === 'jsonParsed') {
                return new Promise(resolve => {
                    answerTable = () => resolve([lookupTable()]);
                });
            }
            return Promise.resolve(sizedAccounts(addresses));
        });

        renderCard(lookupMessage(), <FetchLookupTable />);
        await findRenderedSizes();

        expect(screen.queryByText('Total Account Size:')).not.toBeInTheDocument();

        answerTable();

        expect(await screen.findByText('Total Account Size:')).toBeInTheDocument();
        // Three static accounts and the two the table resolves, at 4 bytes each.
        expect(screen.getByText('20 bytes')).toBeInTheDocument();
    });

    test('should drop the total when a lookup table resolves to no addresses', async () => {
        mockGetMultipleAccounts.mockImplementation((addresses, options) =>
            Promise.resolve(options.encoding === 'jsonParsed' ? [unparseableTable()] : sizedAccounts(addresses)),
        );

        renderCard(lookupMessage(), <FetchLookupTable />);
        await findRenderedSizes();
        await screen.findAllByText('Invalid Lookup Table');

        expect(screen.queryByText('Total Account Size:')).not.toBeInTheDocument();
    });

    test('should report a failed fetch instead of an empty viewer', async () => {
        mockGetAccountInfo.mockRejectedValue(new Error('RPC unavailable'));

        renderCard();
        await openFirstViewer();

        expect(await screen.findByText('Failed to load account data.')).toBeInTheDocument();
        expect(screen.queryByText('No data')).not.toBeInTheDocument();
    });
});

function renderCard(
    message: VersionedMessage = mock.deserializeMessage(stubs.systemTransferMsg),
    alongside?: React.ReactNode,
) {
    return render(
        <SWRConfig value={{ provider: () => new Map() }}>
            <ClusterProvider>
                <AccountsProvider>
                    {alongside}
                    <AccountsCard message={message} />
                </AccountsProvider>
            </ClusterProvider>
        </SWRConfig>,
    );
}

// A name filter computes an accessible name for every button on the card, so one attempt over a
// message this size costs more than the query's own timeout.
function findRenderedSizes() {
    return screen.findAllByText('4 bytes');
}

// A message this size leaves the second request little margin inside the default one-second wait.
function waitForSecondBatch() {
    return vi.waitFor(() => expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(2), { timeout: 5000 });
}

// The provider splits a read into batches, so a count this high answers in more than one request.
function overOneBatchOfAccounts(count: number): VersionedMessage {
    return new Message({
        accountKeys: Array.from({ length: count }, (_, i) => new PublicKey(new Uint8Array(32).fill(i))),
        header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 1, numRequiredSignatures: 1 },
        instructions: [],
        recentBlockhash: '4BbJaBaqatXh5gbRry2yGerZoDm8MP3Tdaw9yVbHSGa3',
    });
}

// The card requests a zero-length data slice, so `space` is the only size the rows can read.
function sizedAccounts(addresses: readonly unknown[]) {
    return (addresses as readonly string[]).map(() => ({
        data: ['', 'base64'],
        executable: false,
        lamports: 1_000_000_000n,
        owner: PublicKey.default.toBase58(),
        space: 4n,
    }));
}

const TABLE_KEY = new PublicKey(new Uint8Array(32).fill(50));
const LOOKED_UP = [60, 61].map(fill => new PublicKey(new Uint8Array(32).fill(fill)));

function lookupMessage(): VersionedMessage {
    return new MessageV0({
        addressTableLookups: [{ accountKey: TABLE_KEY, readonlyIndexes: [1], writableIndexes: [0] }],
        compiledInstructions: [],
        header: { numReadonlySignedAccounts: 0, numReadonlyUnsignedAccounts: 1, numRequiredSignatures: 1 },
        recentBlockhash: '4BbJaBaqatXh5gbRry2yGerZoDm8MP3Tdaw9yVbHSGa3',
        staticAccountKeys: [1, 2, 3].map(fill => new PublicKey(new Uint8Array(32).fill(fill))),
    });
}

// The inspector page reads the tables a message names, not the card, so the test supplies that read.
function FetchLookupTable() {
    const fetchAccount = useFetchAccountInfo();
    React.useEffect(() => {
        fetchAccount(TABLE_KEY, 'parsed');
    }, [fetchAccount]);
    return null;
}

function lookupTable() {
    return {
        data: {
            parsed: {
                info: {
                    addresses: LOOKED_UP.map(key => key.toBase58()),
                    authority: PublicKey.default.toBase58(),
                    deactivationSlot: '18446744073709551615',
                    lastExtendedSlot: '0',
                    lastExtendedSlotStartIndex: 0,
                },
                type: 'lookupTable',
            },
            program: 'address-lookup-table',
            space: 100n,
        },
        executable: false,
        lamports: 1_000_000_000n,
        owner: 'AddressLookupTab1e1111111111111111111111111',
        space: 100n,
    };
}

// Fetched, but not as a lookup table, so the provider resolves it to a string and its rows have no
// address to read a size from.
function unparseableTable() {
    return {
        data: ['', 'base64'],
        executable: false,
        lamports: 1_000_000_000n,
        owner: PublicKey.default.toBase58(),
        space: 0n,
    };
}

async function openFirstViewer() {
    const sizeButtons = await screen.findAllByRole('button', { name: '4 bytes' });
    await userEvent.click(sizeButtons[0]);
}
