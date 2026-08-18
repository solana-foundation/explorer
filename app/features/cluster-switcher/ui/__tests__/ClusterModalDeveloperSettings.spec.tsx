import { customUrlEnabledAtom } from '@entities/cluster';
import { fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { beforeEach, describe, expect, it } from 'vitest';

import { ClusterModalDeveloperSettings } from '../ClusterModalDeveloperSettings';

function renderSettings(enabled = false) {
    const store = createStore();
    if (enabled) store.set(customUrlEnabledAtom, true);
    return {
        store,
        ...render(
            <Provider store={store}>
                <ClusterModalDeveloperSettings />
            </Provider>,
        ),
    };
}

describe('ClusterModalDeveloperSettings', () => {
    beforeEach(() => localStorage.clear());

    it('should not enable the bypass until it is confirmed', () => {
        // A standing permission for every link the browser opens, so the toggle alone must not be enough.
        const { store } = renderSettings();

        fireEvent.click(screen.getByRole('switch'));

        expect(screen.getByTestId('custom-url-consent')).toBeInTheDocument();
        expect(store.get(customUrlEnabledAtom)).toBe(false);
    });

    it('should enable the bypass on confirm', () => {
        const { store } = renderSettings();

        fireEvent.click(screen.getByRole('switch'));
        fireEvent.click(screen.getByTestId('consent-confirm'));

        expect(store.get(customUrlEnabledAtom)).toBe(true);
        expect(screen.queryByTestId('custom-url-consent')).not.toBeInTheDocument();
    });

    it('should leave the bypass off on cancel', () => {
        const { store } = renderSettings();

        fireEvent.click(screen.getByRole('switch'));
        fireEvent.click(screen.getByTestId('consent-cancel'));

        expect(store.get(customUrlEnabledAtom)).toBe(false);
        expect(screen.queryByTestId('custom-url-consent')).not.toBeInTheDocument();
    });

    it('should turn the bypass off without asking', () => {
        // Confirmation slows down granting permission. Revoking only makes the app safer, so a dialog
        // here would just train people to click through.
        const { store } = renderSettings(true);

        fireEvent.click(screen.getByRole('switch'));

        expect(store.get(customUrlEnabledAtom)).toBe(false);
        expect(screen.queryByTestId('custom-url-consent')).not.toBeInTheDocument();
    });
});
