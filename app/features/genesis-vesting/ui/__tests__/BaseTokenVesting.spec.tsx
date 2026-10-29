import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ADVISORS_LOCK, TEAM_LOCK } from '../../__tests__/__fixtures__/lock-accounts';
import { readVestingLock } from '../../lib/read-vesting-lock';
import { BaseTokenVesting } from '../BaseTokenVesting';

vi.mock('@components/common/Address', () => ({ Address: () => null }));

// "Cliff + 1d" in genesis-vesting-kit docs/test-token.md: Team 200M vested, Advisors 28,571,428.57 vested.
const NOW = 1_791_401_512 + 3_600 + 86_400;
const SUPPLY = 1_000_000_000_000_000n;

describe('BaseTokenVesting', () => {
    it('should subtract the locked amount of every lock from the supply', () => {
        render(<BaseTokenVesting locks={[lock(TEAM_LOCK), lock(ADVISORS_LOCK)]} supply={SUPPLY} decimals={6} />);

        expect(screen.getByText('371,428,571.428571 (37.14%)')).toBeInTheDocument();
        expect(screen.getByText('628,571,428.571429')).toBeInTheDocument();
    });
});

function lock(fixture: { address: string; base64: string }) {
    const decoded = readVestingLock(new Uint8Array(Buffer.from(fixture.base64, 'base64')), NOW);
    if (!decoded) throw new Error('fixture did not decode');
    return { address: fixture.address as never, lock: decoded };
}
