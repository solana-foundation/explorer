import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { IdlInstructionCard } from '../IdlInstructionCard';

// Each renderer is tested in its own right; here we only assert the kind→card mapping and that the
// signature is forwarded to the Anchor card (needed for event decoding).
vi.mock('../CodamaInstructionCard', () => ({
    CodamaInstructionCard: () => <div data-testid="codama-card" />,
}));
vi.mock('../AnchorDetailsCard', () => ({
    AnchorDetailsCard: ({ signature }: { signature: string }) => <div data-testid="anchor-card">{signature}</div>,
}));
vi.mock('@/app/components/instruction/UnknownDetailsCard', () => ({
    UnknownDetailsCard: () => <div data-testid="unknown-card" />,
}));

const ix = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PublicKey.unique() });
const props = { childIndex: undefined, index: 0, innerCards: undefined, ix, result: { err: null }, signature: 'SIG' };

describe('IdlInstructionCard', () => {
    it('should render the Codama card for a codama decode', () => {
        render(
            <IdlInstructionCard
                {...props}
                decoded={{ kind: 'codama', parsedIx: { accounts: [], path: [] } as never }}
            />,
        );
        expect(screen.getByTestId('codama-card')).toBeInTheDocument();
    });

    it('should render the Anchor card and forward the signature for an anchor decode', () => {
        render(
            <IdlInstructionCard {...props} decoded={{ details: {} as never, kind: 'anchor', program: {} as never }} />,
        );
        expect(screen.getByTestId('anchor-card')).toHaveTextContent('SIG');
    });

    it('should render the Unknown card for an unknown decode', () => {
        render(<IdlInstructionCard {...props} decoded={{ kind: 'unknown' }} />);
        expect(screen.getByTestId('unknown-card')).toBeInTheDocument();
    });
});
