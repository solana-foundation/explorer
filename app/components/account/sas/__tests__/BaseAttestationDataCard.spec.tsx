import { render, screen } from '@testing-library/react';

import { BaseAttestationDataCard } from '../BaseAttestationDataCard';

describe('BaseAttestationDataCard', () => {
    it('should name the section after the tab', () => {
        render(<BaseAttestationDataCard data={{ score: 'U16' }} />);

        expect(screen.getByRole('heading', { name: 'Attestation Service' })).toBeInTheDocument();
    });

    it('should render decoded data in the JSON viewer', () => {
        render(<BaseAttestationDataCard data={{ chain: 'solana', score: '56.59' }} />);

        expect(screen.getByText('solana')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument();
    });

    it('should render raw base64 as text with its own copy button', () => {
        render(<BaseAttestationDataCard raw="AQIDBA==" />);

        expect(screen.getByText('AQIDBA==')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Copy base64' })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Copy JSON' })).not.toBeInTheDocument();
    });

    it('should mark empty raw data', () => {
        render(<BaseAttestationDataCard raw="" />);

        expect(screen.getByText('(empty)')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Copy base64' })).not.toBeInTheDocument();
    });
});
