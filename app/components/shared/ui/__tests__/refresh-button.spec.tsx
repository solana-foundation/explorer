import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RefreshButton } from '../refresh-button';

describe('RefreshButton', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should show a disabled checkmark after a clicked refresh ends', () => {
        const { rerender } = renderButton(false);

        fireEvent.click(refreshButton());
        rerender(button(true));
        rerender(button(false));

        expect(refreshButton()).toBeDisabled();
        expect(screen.getByText('Refreshed')).toBeInTheDocument();
    });

    it('should enable the button again after the cooldown', () => {
        const { rerender } = renderButton(false);

        fireEvent.click(refreshButton());
        rerender(button(true));
        rerender(button(false));
        act(() => vi.advanceTimersByTime(2000));

        expect(refreshButton()).toBeEnabled();
        expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    // History cards keep their old rows after a failed fetch, so the button must stay usable for a retry.
    it('should enable the button without a checkmark after a clicked refresh fails', () => {
        const { rerender } = renderButton(false);

        fireEvent.click(refreshButton());
        rerender(button(true));
        rerender(button(false, true));

        expect(refreshButton()).toBeEnabled();
        expect(screen.queryByText('Refreshed')).not.toBeInTheDocument();
    });

    // The account fetch starts after the click, so the first render after the click still has `fetching` false.
    it('should keep the button enabled until the clicked refresh starts fetching', () => {
        const { rerender } = renderButton(false);

        fireEvent.click(refreshButton());
        rerender(button(false));

        expect(refreshButton()).toBeEnabled();
        expect(screen.queryByText('Refreshed')).not.toBeInTheDocument();
    });

    // History cards also set `fetching` when Load more runs.
    it('should not show the checkmark after a fetch that the button did not start', () => {
        const { rerender } = renderButton(false);

        rerender(button(true));
        rerender(button(false));

        expect(refreshButton()).toBeEnabled();
        expect(screen.queryByText('Refreshed')).not.toBeInTheDocument();
    });
});

function renderButton(fetching: boolean) {
    return render(button(fetching));
}

function button(fetching: boolean, failed = false) {
    return <RefreshButton analyticsSection="test" fetching={fetching} failed={failed} onClick={() => {}} />;
}

function refreshButton() {
    return screen.getByRole('button', { name: 'Refresh' });
}
