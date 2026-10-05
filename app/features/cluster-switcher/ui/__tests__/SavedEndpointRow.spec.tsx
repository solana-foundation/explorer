import { act, fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { savedClustersAtom } from '../../lib/cluster-storage';
import { SavedEndpointRow } from '../SavedEndpointRow';

const ENTRY = { name: 'Staging', url: 'http://staging.example.com' };

function renderRow() {
    const store = createStore();
    store.set(savedClustersAtom, [ENTRY]);
    const utils = render(
        <Provider store={store}>
            <ul>
                <SavedEndpointRow active={false} entry={ENTRY} onPick={vi.fn()} />
            </ul>
        </Provider>,
    );
    return { store, ...utils };
}

describe('SavedEndpointRow delete and undo', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should keep the entry in storage while the undo window is open', () => {
        const { store } = renderRow();
        fireEvent.click(screen.getByTestId(`delete-cluster-${ENTRY.url}`));
        expect(screen.getByTestId(`restore-cluster-${ENTRY.url}`)).toBeInTheDocument();
        expect(store.get(savedClustersAtom)).toEqual([ENTRY]);
    });

    it('should cancel the removal when Restore is clicked', () => {
        const { store } = renderRow();
        fireEvent.click(screen.getByTestId(`delete-cluster-${ENTRY.url}`));
        fireEvent.click(screen.getByTestId(`restore-cluster-${ENTRY.url}`));
        act(() => vi.advanceTimersByTime(10_000));
        expect(store.get(savedClustersAtom)).toEqual([ENTRY]);
        expect(screen.getByTestId(`pick-cluster-${ENTRY.url}`)).toBeInTheDocument();
    });

    it('should commit the removal once the undo window elapses', () => {
        const { store } = renderRow();
        fireEvent.click(screen.getByTestId(`delete-cluster-${ENTRY.url}`));
        act(() => vi.advanceTimersByTime(10_000));
        expect(store.get(savedClustersAtom)).toEqual([]);
    });

    // Closing the menu drops the row; a pending delete must still land rather than silently resurrect.
    it('should commit a pending removal when the row unmounts', () => {
        const { store, unmount } = renderRow();
        fireEvent.click(screen.getByTestId(`delete-cluster-${ENTRY.url}`));
        unmount();
        expect(store.get(savedClustersAtom)).toEqual([]);
    });
});
