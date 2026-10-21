import type { Account } from '@providers/accounts';
import { type CacheEntry, FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClusterStatus } from '@utils/cluster';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ParsedAccountRenderer } from '../ParsedAccountRenderer';

const mock = vi.hoisted(() => ({ entry: undefined as CacheEntry<Account> | undefined }));

vi.mock('@providers/accounts', () => ({
    useAccountInfo: () => mock.entry,
    useFetchAccountInfo: () => vi.fn(),
}));
vi.mock('@providers/cluster', () => ({ useCluster: () => ({ status: ClusterStatus.Connecting }) }));
vi.mock('@/app/utils/url', () => ({ useClusterPath: () => '/address/addr' }));
vi.mock('next/navigation', () => ({ RedirectType: { replace: 'replace' }, redirect: vi.fn() }));

describe('ParsedAccountRenderer', () => {
    beforeEach(() => {
        mock.entry = undefined;
    });

    it('should keep the rendered component mounted while a refresh fetches the account', async () => {
        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetched };
        const { rerender } = render(<ParsedAccountRenderer address={ADDRESS} renderComponent={ClickCounter} />);
        await userEvent.click(screen.getByRole('button', { name: 'clicks: 0' }));

        mock.entry = { data: ACCOUNT, status: FetchStatus.Fetching };
        rerender(<ParsedAccountRenderer address={ADDRESS} renderComponent={ClickCounter} />);

        expect(screen.getByRole('button', { name: 'clicks: 1' })).toBeInTheDocument();
        expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    it('should show the loading card while the account is fetching and has no data', () => {
        mock.entry = { status: FetchStatus.Fetching };
        render(<ParsedAccountRenderer address={ADDRESS} renderComponent={ClickCounter} />);

        expect(screen.getByText('Loading')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'clicks: 0' })).not.toBeInTheDocument();
    });

    it('should show the loading card before the account is requested', () => {
        render(<ParsedAccountRenderer address={ADDRESS} renderComponent={ClickCounter} />);

        expect(screen.getByText('Loading')).toBeInTheDocument();
    });

    it('should show the error card when the fetch fails without data', () => {
        mock.entry = { status: FetchStatus.FetchFailed };
        render(<ParsedAccountRenderer address={ADDRESS} renderComponent={ClickCounter} />);

        expect(screen.getByText('Fetch Failed')).toBeInTheDocument();
    });
});

const ADDRESS = PublicKey.default.toBase58();

const ACCOUNT: Account = {
    data: {},
    executable: false,
    lamports: 1,
    owner: PublicKey.default,
    pubkey: PublicKey.default,
    space: 0,
};

function ClickCounter() {
    const [clicks, setClicks] = useState(0);
    return <button onClick={() => setClicks(count => count + 1)}>clicks: {clicks}</button>;
}
