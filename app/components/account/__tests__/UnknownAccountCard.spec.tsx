import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type Account } from '@/app/providers/accounts';

import { UnknownAccountCard } from '../UnknownAccountCard';

vi.mock('@providers/cluster', () => ({ useCluster: () => ({ cluster: 'devnet', url: 'http://localhost' }) }));
vi.mock('@entities/account', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/account')>()),
    useAccountFetching: () => false,
    useRawAccountDataOnMount: () => ({ data: undefined, isLoading: false }),
}));
vi.mock('@entities/idl', () => ({
    ProgramIdlSelector: ({ programAddress }: { programAddress: string }) => <span>selector for {programAddress}</span>,
}));

const OWNER = new PublicKey('devi51mZmdwUJGU9hjN27vEz64Gps7uUefqxg27EAtH');

describe('UnknownAccountCard', () => {
    it('should show the owner program IDL selector in the Overview header', () => {
        const account: Account = { data: {}, executable: false, lamports: 1, owner: OWNER, pubkey: PublicKey.default };

        render(<UnknownAccountCard account={account} />);

        expect(screen.getByText(`selector for ${OWNER.toBase58()}`)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
    });
});
