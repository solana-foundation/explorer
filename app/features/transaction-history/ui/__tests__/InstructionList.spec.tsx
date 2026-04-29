import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InstructionList } from '../InstructionList';

describe('InstructionList', () => {
    it('renders all instructions inline when instructions.length <= 3', () => {
        render(
            <InstructionList
                instructions={[
                    { name: 'Transfer', program: 'System' },
                    { name: 'Mint To', program: 'Token' },
                    { name: 'Burn', program: 'Token' },
                ]}
            />,
        );

        expect(screen.getByText('Transfer')).toBeInTheDocument();
        expect(screen.getByText('Mint To')).toBeInTheDocument();
        expect(screen.getByText('Burn')).toBeInTheDocument();
        // eslint-disable-next-line no-restricted-syntax -- regex needed to match any "more" text
        expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });

    it('renders first 3 instructions and overflow badge when instructions.length > 3', () => {
        const instructions = [
            { name: 'Transfer', program: 'System' },
            { name: 'Mint To', program: 'Token' },
            { name: 'Burn', program: 'Token' },
            { name: 'Transfer Checked', program: 'Token' },
            { name: 'Set Compute Unit Limit', program: 'Compute Budget' },
        ];
        render(<InstructionList instructions={instructions} />);

        expect(screen.getByText('Transfer')).toBeInTheDocument();
        expect(screen.getByText('Mint To')).toBeInTheDocument();
        expect(screen.getByText('Burn')).toBeInTheDocument();
        expect(screen.queryByText('Transfer Checked')).not.toBeInTheDocument();
        expect(screen.queryByText('Set Compute Unit Limit')).not.toBeInTheDocument();
        expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('renders single instruction without overflow', () => {
        render(<InstructionList instructions={[{ name: 'Transfer', program: 'System' }]} />);

        expect(screen.getByText('Transfer')).toBeInTheDocument();
        // eslint-disable-next-line no-restricted-syntax -- regex needed to match any "more" text
        expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });

    it('renders exactly 4 instructions with +1 more overflow badge', () => {
        render(
            <InstructionList
                instructions={[
                    { name: 'Transfer', program: 'System' },
                    { name: 'Mint To', program: 'Token' },
                    { name: 'Burn', program: 'Token' },
                    { name: 'Transfer Checked', program: 'Token' },
                ]}
            />,
        );

        expect(screen.getByText('+1 more')).toBeInTheDocument();
        expect(screen.queryByText('Transfer Checked')).not.toBeInTheDocument();
    });
});
