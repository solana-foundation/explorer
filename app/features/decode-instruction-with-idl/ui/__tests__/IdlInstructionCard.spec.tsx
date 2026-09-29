import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CodamaInstructionCard } from '../CodamaInstructionCard';
import { IdlInstructionCard } from '../IdlInstructionCard';

vi.mock('../CodamaInstructionCard', () => ({
    CodamaInstructionCard: vi.fn(() => <div data-testid="codama-card" />),
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
    afterEach(() => {
        vi.mocked(CodamaInstructionCard).mockReset();
        vi.restoreAllMocks();
    });

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

    it('should render the Unknown card when the decoded card throws', () => {
        const failure = new Error('decode failed');
        vi.mocked(CodamaInstructionCard).mockImplementation(() => {
            throw failure;
        });
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        render(
            <IdlInstructionCard
                {...props}
                decoded={{ kind: 'codama', parsedIx: { accounts: [], path: [] } as never }}
            />,
        );

        expect(screen.getByTestId('unknown-card')).toBeInTheDocument();
    });

    it('should render the Unknown card for an unknown decode', () => {
        render(<IdlInstructionCard {...props} decoded={{ kind: 'unknown' }} />);
        expect(screen.getByTestId('unknown-card')).toBeInTheDocument();
    });
});
