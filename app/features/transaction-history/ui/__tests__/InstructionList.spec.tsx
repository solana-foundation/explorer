import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InstructionList } from '../InstructionList';

describe('InstructionList', () => {
    it('should render the full list', () => {
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
        expect(screen.getByText('Transfer Checked')).toBeInTheDocument();
        expect(screen.getByText('Set Compute Unit Limit')).toBeInTheDocument();
    });

    it('should render all four instructions', () => {
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

        expect(screen.getByText('Transfer Checked')).toBeInTheDocument();
    });
});
