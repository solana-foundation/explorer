import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TEAM_LOCK } from '../../__tests__/__fixtures__/lock-accounts';
import { TokenVestingCard } from '../TokenVestingCard';

const mock = vi.hoisted(() => ({ locks: {} as Record<string, unknown>, mutate: vi.fn() }));

vi.mock('../../model/use-vesting-locks', () => ({
    useVestingLocks: () => ({ isValidating: false, mutate: mock.mutate, ...mock.locks }),
}));
vi.mock('@providers/accounts', () => ({
    useMintAccountInfo: () => ({ decimals: 6, supply: '1000000000000000' }),
}));
vi.mock('@components/common/Address', () => ({ Address: () => null }));

describe('TokenVestingCard', () => {
    beforeEach(() => {
        mock.mutate.mockClear();
        mock.locks = {};
    });

    it('should offer a retry that refetches the locks after a failed load', () => {
        mock.locks = { data: undefined, error: new Error('getProgramAccounts rejected') };
        render(<TokenVestingCard mint={MINT} />);

        expect(screen.getByText('Failed to load vesting locks.')).toBeInTheDocument();
        fireEvent.click(screen.getAllByText('Try Again')[0]);
        expect(mock.mutate).toHaveBeenCalledOnce();
    });

    it('should refetch the locks from the refresh button once loaded', () => {
        mock.locks = { data: [{ address: TEAM_LOCK.address, data: bytes(TEAM_LOCK.base64) }], error: undefined };
        render(<TokenVestingCard mint={MINT} />);

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        expect(mock.mutate).toHaveBeenCalledOnce();
    });
});

const MINT = '6LNGVeWcQVKDPNktwSJNFXe3Y5HYWVPWJFnggjSbTFYu';

function bytes(base64: string): Uint8Array {
    return new Uint8Array(Buffer.from(base64, 'base64'));
}
