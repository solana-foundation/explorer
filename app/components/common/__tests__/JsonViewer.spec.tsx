import { render, screen } from '@testing-library/react';

import { JsonViewer } from '../JsonViewer';

describe('JsonViewer', () => {
    it('should render the v2 tree with a copy button for the whole block', () => {
        render(<JsonViewer version="v2" src={{ chain: 'solana' }} />);

        expect(screen.getByText('solana')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Copy JSON' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Copy chain' })).toBeInTheDocument();
    });
});
