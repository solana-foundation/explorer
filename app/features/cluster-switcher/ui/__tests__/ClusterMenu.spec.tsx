import { fireEvent, render, screen } from '@testing-library/react';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { createStore, Provider } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { type SavedCluster, savedClustersAtom } from '../../lib/cluster-storage';

const NEW_URL = 'http://my-validator:8899';

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), searchParams: new URLSearchParams() }));

// Start on a built-in cluster so the custom draft begins empty and the gating tests type from scratch.
const active = vi.hoisted(() => ({ cluster: 0, endpoint: undefined as URL | undefined }));

vi.mock('next/navigation', () => ({
    usePathname: () => '/',
    useRouter: () => ({ push: nav.push, replace: nav.replace }),
    useSearchParams: () => nav.searchParams,
}));

vi.mock('@shared/lib/scrollToTop', () => ({ scrollToTop: vi.fn() }));

vi.mock('@entities/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/cluster')>();
    return {
        ...actual,
        useCluster: () => ({ cluster: active.cluster, endpoint: active.endpoint, status: ClusterStatus.Connected }),
    };
});

// Must import after mocks
import { ClusterMenu } from '../ClusterMenu';

function renderMenu(initialClusters: SavedCluster[] = [], onDismiss: () => void = vi.fn()) {
    const store = createStore();
    if (initialClusters.length > 0) store.set(savedClustersAtom, initialClusters);
    return {
        store,
        ...render(
            <Provider store={store}>
                <ClusterMenu onDismiss={() => onDismiss()} />
            </Provider>,
        ),
    };
}

beforeEach(() => {
    vi.clearAllMocks();
    active.cluster = Cluster.MainnetBeta;
    active.endpoint = undefined;
});

describe('ClusterMenu deleting the active saved endpoint', () => {
    const ACTIVE_URL = 'http://active-validator:8899/';
    const OTHER_URL = 'http://other-validator:8899/';
    const saved = [
        { name: 'Active', url: ACTIVE_URL },
        { name: 'Other', url: OTHER_URL },
    ];

    beforeEach(() => {
        active.cluster = Cluster.Custom;
        active.endpoint = new URL(ACTIVE_URL);
    });

    it('should fall back to the default cluster when the menu closes with the delete pending', () => {
        const { store, unmount } = renderMenu(saved);
        fireEvent.click(screen.getByTestId(`delete-cluster-${ACTIVE_URL}`));
        unmount();

        expect(store.get(savedClustersAtom)).toEqual([{ name: 'Other', url: OTHER_URL }]);
        expect(nav.push).toHaveBeenCalledTimes(1);
    });

    it('should keep the picked endpoint when a pick closes the menu with the delete pending', () => {
        let close: () => void = vi.fn();
        const { store, unmount } = renderMenu(saved, () => close());
        close = unmount;
        fireEvent.click(screen.getByTestId(`delete-cluster-${ACTIVE_URL}`));
        fireEvent.click(screen.getByTestId(`pick-cluster-${OTHER_URL}`));

        expect(store.get(savedClustersAtom)).toEqual([{ name: 'Other', url: OTHER_URL }]);
        expect(nav.push).not.toHaveBeenCalled();
    });
});

describe('ClusterMenu custom endpoint', () => {
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
