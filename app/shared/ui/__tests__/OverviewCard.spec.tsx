import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OverviewCard } from '../OverviewCard';

describe('OverviewCard', () => {
    it('should render the title, actions, note and children', () => {
        render(
            <OverviewCard title="Overview" actions={<button type="button">Refresh</button>} note={<p>Heads up</p>}>
                <div>Body</div>
            </OverviewCard>,
        );

        expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
        expect(screen.getByText('Heads up')).toBeInTheDocument();
        expect(screen.getByText('Body')).toBeInTheDocument();
    });
});
