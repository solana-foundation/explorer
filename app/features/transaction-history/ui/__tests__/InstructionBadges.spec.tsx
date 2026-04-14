import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { InstructionBadges } from '../InstructionBadges';

describe('InstructionBadges', () => {
    it('renders all badges inline when names.length <= 3', () => {
        render(<InstructionBadges names={['System: Transfer', 'Token: Mint To', 'Token: Burn']} />);

        expect(screen.getByText('System: Transfer')).toBeInTheDocument();
        expect(screen.getByText('Token: Mint To')).toBeInTheDocument();
        expect(screen.getByText('Token: Burn')).toBeInTheDocument();
        // eslint-disable-next-line no-restricted-syntax -- regex needed to match any "more" text
        expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });

    it('renders first 3 badges and overflow badge when names.length > 3', () => {
        const names = [
            'System: Transfer',
            'Token: Mint To',
            'Token: Burn',
            'Token: Transfer Checked',
            'Compute Budget: Set Compute Unit Limit',
        ];
        render(<InstructionBadges names={names} />);

        expect(screen.getByText('System: Transfer')).toBeInTheDocument();
        expect(screen.getByText('Token: Mint To')).toBeInTheDocument();
        expect(screen.getByText('Token: Burn')).toBeInTheDocument();
        expect(screen.queryByText('Token: Transfer Checked')).not.toBeInTheDocument();
        expect(screen.queryByText('Compute Budget: Set Compute Unit Limit')).not.toBeInTheDocument();
        expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('renders single badge without overflow', () => {
        render(<InstructionBadges names={['System: Transfer']} />);

        expect(screen.getByText('System: Transfer')).toBeInTheDocument();
        // eslint-disable-next-line no-restricted-syntax -- regex needed to match any "more" text
        expect(screen.queryByText(/more/)).not.toBeInTheDocument();
    });

    it('renders exactly 4 names with +1 more overflow badge', () => {
        render(
            <InstructionBadges
                names={['System: Transfer', 'Token: Mint To', 'Token: Burn', 'Token: Transfer Checked']}
            />,
        );

        expect(screen.getByText('+1 more')).toBeInTheDocument();
        expect(screen.queryByText('Token: Transfer Checked')).not.toBeInTheDocument();
    });
});
