/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation');

// Rows read their accounts through the provider, which waits for the cluster handshake.
vi.mock('@/app/entities/cluster/api/fetch-genesis-hash', () => ({
    fetchGenesisHash: vi.fn(async () => 'genesis'),
}));

const mockGetMultipleAccounts = vi.fn();
const mockGetAccountInfo = vi.fn();

// The viewer reads through the account slice; the accounts provider reads through the entity root.
// Both have to answer, or the rows and the popover disagree about what the cluster holds.
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

import { PublicKey } from '@solana/web3.js';

import * as stubs from '@/app/__tests__/mock-stubs';
import * as mock from '@/app/__tests__/mocks';
import { AccountsProvider } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { toBase64 } from '@/app/shared/lib/bytes';

import { AccountsCard } from '../AccountsCard';

const ACCOUNT_BYTES = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

function renderCard() {
    const message = mock.deserializeMessage(stubs.systemTransferMsg);

    return render(
        <SWRConfig value={{ provider: () => new Map() }}>
            <ClusterProvider>
                <AccountsProvider>
                    <AccountsCard message={message} />
                </AccountsProvider>
            </ClusterProvider>
        </SWRConfig>,
    );
}

// A zero-length slice: no bytes, but the owner, balance and size every row renders. Each account
// reports 4 bytes, so its size becomes the button that opens the viewer.
function sizedAccounts(addresses: readonly unknown[]) {
    return (addresses as readonly string[]).map(() => ({
        data: ['', 'base64'],
        executable: false,
        lamports: 1_000_000_000n,
        owner: PublicKey.default.toBase58(),
        space: 4n,
    }));
}

async function openFirstViewer() {
    const sizeButton = await screen.findAllByRole('button', { name: /4 bytes/ });
    fireEvent.click(sizeButton[0]);
}

describe('inspector::AccountsCard raw data', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetMultipleAccounts.mockImplementation(async addresses => sizedAccounts(addresses));
    });

    test('should not request account data while the list renders', async () => {
        renderCard();

        await screen.findAllByRole('button', { name: /4 bytes/ });

        expect(mockGetMultipleAccounts).toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ dataSlice: { length: 0, offset: 0 } }),
        );
        expect(mockGetAccountInfo).not.toHaveBeenCalled();
    });

    test('should read owner, balance and size from one batch request', async () => {
        renderCard();

        await screen.findAllByRole('button', { name: /4 bytes/ });

        expect(mockGetMultipleAccounts).toHaveBeenCalledTimes(1);
    });

    test('should request only the opened account, and show the viewer once it arrives', async () => {
        mockGetAccountInfo.mockResolvedValue({ data: [toBase64(ACCOUNT_BYTES), 'base64'] });

        renderCard();
        await openFirstViewer();

        await waitFor(() => {
            expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
        });
        expect(await screen.findByRole('tab', { name: 'Hex' })).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Copy/ })).toBeEnabled();
        });
    });

    test('should report a failed fetch instead of an empty viewer', async () => {
        mockGetAccountInfo.mockRejectedValue(new Error('RPC unavailable'));

        renderCard();
        await openFirstViewer();

        expect(await screen.findByText('Failed to load account data.')).toBeInTheDocument();
        expect(screen.queryByText('No data')).not.toBeInTheDocument();
    });
});
