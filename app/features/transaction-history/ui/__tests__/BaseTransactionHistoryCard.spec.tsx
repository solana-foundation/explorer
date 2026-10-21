import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BaseTransactionHistoryCard } from '../BaseTransactionHistoryCard';

describe('BaseTransactionHistoryCard', () => {
    it('should keep the refresh button usable after a refresh fails', () => {
        const { rerender } = render(card({ failed: false, fetching: false }));

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }));
        rerender(card({ failed: false, fetching: true }));
        rerender(card({ failed: true, fetching: false }));

        expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled();
        expect(screen.queryByText('Refreshed')).not.toBeInTheDocument();
    });
});

function card({ fetching, failed }: { fetching: boolean; failed: boolean }) {
    return (
        <BaseTransactionHistoryCard
            rows={[]}
            fetching={fetching}
            failed={failed}
            foundOldest
            onRefresh={() => {}}
            onLoadMore={() => {}}
            renderRow={() => null}
        />
    );
}
