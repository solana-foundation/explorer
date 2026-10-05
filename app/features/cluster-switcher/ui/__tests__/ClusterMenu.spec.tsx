import { fireEvent, render, screen } from '@testing-library/react';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { createStore, Provider } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type SavedCluster, savedClustersAtom } from '../../lib/cluster-storage';

const NEW_URL = 'http://my-validator:8899';

const nav = vi.hoisted(() => ({ replace: vi.fn(), searchParams: new URLSearchParams() }));

vi.mock('next/navigation', () => ({
    usePathname: () => '/',
    useRouter: () => ({ push: vi.fn(), replace: nav.replace }),
    useSearchParams: () => nav.searchParams,
}));

// Start on a built-in cluster so the custom draft begins empty and the gating tests type from scratch.
vi.mock('@entities/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/cluster')>();
    return {
        ...actual,
        useCluster: () => ({ cluster: Cluster.MainnetBeta, endpoint: undefined, status: ClusterStatus.Connected }),
    };
});

// Must import after mocks
import { ClusterMenu } from '../ClusterMenu';

function renderMenu(initialClusters: SavedCluster[] = []) {
    const store = createStore();
    if (initialClusters.length > 0) store.set(savedClustersAtom, initialClusters);
    return {
        store,
        ...render(
            <Provider store={store}>
                <ClusterMenu onDismiss={vi.fn()} />
            </Provider>,
        ),
    };
}

describe('ClusterMenu custom endpoint', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should enable Go and Save only once the typed URL parses as an endpoint', () => {
        renderMenu();
        expect(screen.getByTestId('go-custom-cluster-btn')).toBeDisabled();
        expect(screen.getByTestId('open-save-cluster-btn')).toBeDisabled();

        fireEvent.change(screen.getByTestId('cluster-url-input'), { target: { value: 'not a url' } });
        expect(screen.getByTestId('go-custom-cluster-btn')).toBeDisabled();

        fireEvent.change(screen.getByTestId('cluster-url-input'), { target: { value: NEW_URL } });
        expect(screen.getByTestId('go-custom-cluster-btn')).toBeEnabled();
        expect(screen.getByTestId('open-save-cluster-btn')).toBeEnabled();
    });

    it('should block saving a URL that is already saved', () => {
        renderMenu([{ name: 'Mine', url: NEW_URL }]);
        fireEvent.change(screen.getByTestId('cluster-url-input'), { target: { value: NEW_URL } });
        const save = screen.getByTestId('open-save-cluster-btn');
        expect(save).toBeDisabled();
        expect(save).toHaveTextContent('Saved');
    });

    it('should persist a new endpoint through the save-from-field flow', () => {
        const { store } = renderMenu();
        fireEvent.change(screen.getByTestId('cluster-url-input'), { target: { value: NEW_URL } });
        fireEvent.click(screen.getByTestId('open-save-cluster-btn'));

        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: 'My validator' } });
        fireEvent.click(screen.getByTestId('confirm-save-cluster-btn'));

        expect(store.get(savedClustersAtom)).toEqual([{ name: 'My validator', url: NEW_URL }]);
    });
});
