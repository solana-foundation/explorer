import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InstructionList } from '../InstructionList';

describe('InstructionList', () => {
    it('should render all instructions inline when instructions.length <= 3', () => {
        render(
            <InstructionList
                instructions={[
                    { name: 'Transfer', programName: 'System' },
                    { name: 'Mint To', programName: 'Token' },
                    { name: 'Burn', programName: 'Token' },
                ]}
            />,
        );

        expect(screen.getByText('Transfer')).toBeInTheDocument();
        expect(screen.getByText('Mint To')).toBeInTheDocument();
        expect(screen.getByText('Burn')).toBeInTheDocument();
        // eslint-disable-next-line no-restricted-syntax -- regex needed to match any "more" text
        expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });

    it('should render first 3 instructions and overflow badge when instructions.length > 3', () => {
        const instructions = [
            { name: 'Transfer', programName: 'System' },
            { name: 'Mint To', programName: 'Token' },
            { name: 'Burn', programName: 'Token' },
            { name: 'Transfer Checked', programName: 'Token' },
            { name: 'Set Compute Unit Limit', programName: 'Compute Budget' },
        ];
        render(<InstructionList instructions={instructions} />);

        expect(screen.getByText('Transfer')).toBeInTheDocument();
        expect(screen.getByText('Mint To')).toBeInTheDocument();
        expect(screen.getByText('Burn')).toBeInTheDocument();
        expect(screen.queryByText('Transfer Checked')).not.toBeInTheDocument();
        expect(screen.queryByText('Set Compute Unit Limit')).not.toBeInTheDocument();
        expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('should render single instruction without overflow', () => {
        render(<InstructionList instructions={[{ name: 'Transfer', programName: 'System' }]} />);

        expect(screen.getByText('Transfer')).toBeInTheDocument();
        // eslint-disable-next-line no-restricted-syntax -- regex needed to match any "more" text
        expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });

    it('should render exactly 4 instructions with +1 more overflow badge', () => {
        render(
            <InstructionList
                instructions={[
                    { name: 'Transfer', programName: 'System' },
                    { name: 'Mint To', programName: 'Token' },
                    { name: 'Burn', programName: 'Token' },
                    { name: 'Transfer Checked', programName: 'Token' },
                ]}
            />,
        );

        expect(screen.getByText('+1 more')).toBeInTheDocument();
        expect(screen.queryByText('Transfer Checked')).not.toBeInTheDocument();
    });
});
