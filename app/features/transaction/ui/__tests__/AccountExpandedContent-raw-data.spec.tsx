import { PublicKey } from '@solana/web3.js';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
// HexData joins the pairs of a span with spaces, and renders a desktop and a mobile copy of the row.
const ACCOUNT_HEX = 'de ad be ef';

const account: Account = {
    data: {},
    executable: false,
    lamports: 1_000_000_000,
    owner: PublicKey.default,
    pubkey: PublicKey.default,
    space: 4,
} as Account;

describe('transaction::AccountExpandedContent raw data', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetAccountInfo.mockResolvedValue({ data: [toBase64(ACCOUNT_BYTES), 'base64'] });
    });

    test('should not request account data until the viewer opens', async () => {
        renderContent();

        expect(await screen.findByRole('button', { name: '4 byte(s)' })).toBeInTheDocument();
        expect(mockGetAccountInfo).not.toHaveBeenCalled();
    });

    test('should show the account bytes in both encodings once the viewer opens', async () => {
        renderContent();
        await openViewer();

        expect(await screen.findAllByText(ACCOUNT_HEX)).not.toHaveLength(0);
        await userEvent.click(screen.getByRole('tab', { name: 'Base64' }));
        expect(await screen.findByText(toBase64(ACCOUNT_BYTES))).toBeInTheDocument();
    });

    test('should request the account once', async () => {
        renderContent();
        await openViewer();

        expect(await screen.findAllByText(ACCOUNT_HEX)).not.toHaveLength(0);
        expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    });

    test('should not fetch again when the viewer is reopened', async () => {
        renderContent();
        await openViewer();
        expect(await screen.findAllByText(ACCOUNT_HEX)).not.toHaveLength(0);

        await closeViewer();
        await openViewer();

        expect(await screen.findAllByText(ACCOUNT_HEX)).not.toHaveLength(0);
        expect(mockGetAccountInfo).toHaveBeenCalledTimes(1);
    });

    test('should retry when the viewer is reopened after a failure', async () => {
        mockGetAccountInfo.mockRejectedValueOnce(new Error('RPC unavailable'));

        renderContent();
        await openViewer();
        expect(await screen.findByText('Failed to load account data.')).toBeInTheDocument();

        await closeViewer();
        await openViewer();

        expect(await screen.findAllByText(ACCOUNT_HEX)).not.toHaveLength(0);
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
    await userEvent.click(await screen.findByRole('button', { name: '4 byte(s)' }));
}

async function closeViewer() {
    await userEvent.click(await screen.findByRole('button', { name: '4 byte(s)' }));
    await waitFor(() => {
        expect(screen.queryByRole('tab', { name: 'Hex' })).not.toBeInTheDocument();
    });
}
