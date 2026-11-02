import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

vi.mock('next/navigation');

import { gen } from '@__fixtures__/gen';

import { ClusterProvider } from '@/app/providers/cluster';

import { Address } from '../Address';

const PUBKEY = gen.publicKey(1);

describe('Address wrapLabel', () => {
    // `noTruncate` also drops mid-truncation, so this case tells the two props apart.
    test('should still mid-truncate a raw address', () => {
        const address = PUBKEY.toBase58();
        renderAddress({ pubkey: PUBKEY, wrapLabel: true });

        expect(screen.getByRole('link', { name: `${address.slice(0, 5)}…${address.slice(-5)}` })).toBeInTheDocument();
    });
});

function renderAddress(props: { pubkey: PublicKey; wrapLabel?: boolean }) {
    return render(
        <ClusterProvider>
            <Address link {...props} />
        </ClusterProvider>,
    );
}
