/* eslint-disable no-restricted-syntax -- test assertions use RegExp for pattern matching */
import { PublicKey } from '@solana/web3.js';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation');

const mockGetAccountInfo = vi.fn();

vi.mock('@entities/cluster/@x/account', async () => {
    const actual = await vi.importActual<typeof import('@entities/cluster/@x/account')>('@entities/cluster/@x/account');
    return {
        ...actual,
        getRpc: vi.fn(() => ({
            getAccountInfo: (...args: unknown[]) => ({
                send: async () => ({ value: await mockGetAccountInfo(...args) }),
            }),
        })),
    };
});

import type { Account } from '@/app/providers/accounts';
import { ClusterProvider } from '@/app/providers/cluster';
import { toBase64 } from '@/app/shared/lib/bytes';

import { AccountExpandedContentInner } from '../AccountExpandedContent';

const ADDRESS = PublicKey.default.toBase58();
const ACCOUNT_BYTES = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);

const account: Account = {
    data: {},
    executable: false,
    lamports: 1_000_000_000,
    owner: PublicKey.default,
    pubkey: PublicKey.default,
    space: 4,
} as Account;

function renderContent() {
    return render(
        <SWRConfig value={{ provider: () => new Map() }}>
            <ClusterProvider>
                <AccountExpandedContentInner address={ADDRESS} data={account} />
            </ClusterProvider>
        </SWRConfig>,
    );
}

async function openViewer() {
    fireEvent.click(await screen.findByRole('button', { name: /4 byte\(s\)/ }));
}

async function closeViewer() {
    fireEvent.click(await screen.findByRole('button', { name: /4 byte\(s\)/ }));
    await waitFor(() => {
        expect(screen.queryByRole('tab', { name: 'Hex' })).not.toBeInTheDocument();
    });
}

describe('transaction::AccountExpandedContent raw data', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('should not request account data until the viewer opens', async () => {
        renderContent();

        expect(await screen.findByRole('button', { name: /4 byte\(s\)/ })).toBeInTheDocument();
        expect(mockGetAccountInfo).not.toHaveBeenCalled();
    });

    test('should request the account and show the viewer once it arrives', async () => {
        mockGetAccountInfo.mockResolvedValue({ data: [toBase64(ACCOUNT_BYTES), 'base64'] });

        renderContent();
        await openViewer();

        await waitFor(() => {
            expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
        });
        expect(await screen.findByRole('tab', { name: 'Hex' })).toBeInTheDocument();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Copy/ })).toBeEnabled();
        });
    });

    test('should not fetch again when the viewer is reopened', async () => {
        mockGetAccountInfo.mockResolvedValue({ data: [toBase64(ACCOUNT_BYTES), 'base64'] });

        renderContent();
        await openViewer();
        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Copy/ })).toBeEnabled();
        });

        await closeViewer();
        await openViewer();

        expect(await screen.findByRole('tab', { name: 'Hex' })).toBeInTheDocument();
        expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    });

    test('should retry when the viewer is reopened after a failure', async () => {
        mockGetAccountInfo.mockRejectedValueOnce(new Error('RPC unavailable'));
        mockGetAccountInfo.mockResolvedValue({ data: [toBase64(ACCOUNT_BYTES), 'base64'] });

        renderContent();
        await openViewer();
        expect(await screen.findByText('Failed to load account data.')).toBeInTheDocument();

        await closeViewer();
        await openViewer();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Copy/ })).toBeEnabled();
        });
        expect(screen.queryByText('Failed to load account data.')).not.toBeInTheDocument();
    });

    test('should report a failed fetch instead of an empty viewer', async () => {
        mockGetAccountInfo.mockRejectedValue(new Error('RPC unavailable'));

        renderContent();
        await openViewer();

        expect(await screen.findByText('Failed to load account data.')).toBeInTheDocument();
        expect(screen.queryByText('No data')).not.toBeInTheDocument();
    });
});
