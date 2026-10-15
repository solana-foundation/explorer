import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AnchorDetailsCard } from '../AnchorDetailsCard';
import { CodamaInstructionCard } from '../CodamaInstructionCard';
import { IdlInstructionCard } from '../IdlInstructionCard';

vi.mock('../CodamaInstructionCard', () => ({
    CodamaInstructionCard: vi.fn(() => <div data-testid="codama-card" />),
}));
vi.mock('../AnchorDetailsCard', () => ({
    AnchorDetailsCard: vi.fn(() => <div data-testid="anchor-card" />),
}));
vi.mock('@entities/instruction-card', async importOriginal => ({
    ...(await importOriginal<typeof import('@entities/instruction-card')>()),
    UnknownDetailsCard: () => <div data-testid="unknown-card" />,
}));

const ix = new TransactionInstruction({ data: Buffer.from([1]), keys: [], programId: PublicKey.unique() });
const innerCards = [<div key="inner" />];
const props = { childIndex: 1, index: 2, innerCards, ix };
const node = { ...props, programId: ix.programId };

describe('IdlInstructionCard', () => {
    afterEach(() => {
        vi.mocked(CodamaInstructionCard).mockReset();
        vi.mocked(AnchorDetailsCard).mockReset();
        vi.restoreAllMocks();
    });

    it('should render the Codama card with the node of the instruction for a codama decode', () => {
        render(
            <IdlInstructionCard
                {...props}
                decoded={{ kind: 'codama', parsedIx: { accounts: [], path: [] } as never }}
            />,
        );
        expect(screen.getByTestId('codama-card')).toBeInTheDocument();
        expect(vi.mocked(CodamaInstructionCard).mock.calls[0][0]).toEqual({ ix, node, parsedIx: expect.anything() });
    });

    it('should render the Anchor card with the node of the instruction for an anchor decode', () => {
        render(
            <IdlInstructionCard {...props} decoded={{ details: {} as never, kind: 'anchor', program: {} as never }} />,
        );
        expect(screen.getByTestId('anchor-card')).toBeInTheDocument();
        expect(vi.mocked(AnchorDetailsCard).mock.calls[0][0]).toEqual({
            decoded: expect.anything(),
            ix,
            node,
            program: expect.anything(),
        });
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

    it('should render the Unknown card when the Anchor card throws', () => {
        vi.mocked(AnchorDetailsCard).mockImplementation(() => {
            throw new Error('rows failed');
        });
        vi.spyOn(console, 'error').mockImplementation(() => undefined);

        render(
            <IdlInstructionCard {...props} decoded={{ details: {} as never, kind: 'anchor', program: {} as never }} />,
        );

        expect(screen.getByTestId('unknown-card')).toBeInTheDocument();
    });

    it('should render the Unknown card for an unknown decode', () => {
        render(<IdlInstructionCard {...props} decoded={{ kind: 'unknown' }} />);
        expect(screen.getByTestId('unknown-card')).toBeInTheDocument();
    });
});
