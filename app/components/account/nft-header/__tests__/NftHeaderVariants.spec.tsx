import { PublicKey } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { NftCreatorsList } from '../NftHeaderVariants';

vi.mock('@components/common/Address', () => ({
    Address: ({ pubkey }: { pubkey: PublicKey }) => <span>{pubkey.toBase58()}</span>,
}));

const ADDRESS_A = '11111111111111111111111111111111';
const ADDRESS_B = 'So11111111111111111111111111111111111111112';

describe('NftCreatorsList', () => {
    it('should mark an unverified creator and leave a verified one plain', () => {
        render(
            <NftCreatorsList
                creators={[
                    { address: ADDRESS_A, share: 60, verified: true },
                    { address: ADDRESS_B, share: 40, verified: false },
                ]}
            />,
        );

        expect(screen.getByText('60%')).toBeDefined();
        expect(screen.getByText('40% · unverified')).toBeDefined();
    });

    it('should show a dash for a null creators list', () => {
        render(<NftCreatorsList creators={null} />);
        expect(screen.getByText('—')).toBeDefined();
    });

    it('should show a dash for an empty creators list', () => {
        render(<NftCreatorsList creators={[]} />);
        expect(screen.getByText('—')).toBeDefined();
    });
});
