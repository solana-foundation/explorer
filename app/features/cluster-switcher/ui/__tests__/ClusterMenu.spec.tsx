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
import { customUrlEnabledAtom } from '@entities/cluster';

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
        expect(nav.push).toHaveBeenCalledExactlyOnceWith('/', { scroll: false });
    });

    it('should stay on the active endpoint when an inactive one is deleted', () => {
        const { store, unmount } = renderMenu(saved);
        fireEvent.click(screen.getByTestId(`delete-cluster-${OTHER_URL}`));
        unmount();

        expect(store.get(savedClustersAtom)).toEqual([{ name: 'Active', url: ACTIVE_URL }]);
        expect(nav.push).not.toHaveBeenCalled();
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

    it.each([
        ['Go', () => fireEvent.click(screen.getByTestId('go-custom-cluster-btn'))],
        ['Enter', () => fireEvent.keyDown(screen.getByTestId('cluster-url-input'), { key: 'Enter' })],
    ])('should switch to the typed endpoint and close on %s', (_label, submit) => {
        const onDismiss = vi.fn();
        renderMenu([], onDismiss);
        fireEvent.change(screen.getByTestId('cluster-url-input'), { target: { value: NEW_URL } });
        submit();

        expect(nav.replace).toHaveBeenCalledExactlyOnceWith(
            `/?cluster=custom&customUrl=${encodeURIComponent(NEW_URL)}`,
            { scroll: false },
        );
        expect(onDismiss).toHaveBeenCalledOnce();
    });

    it('should ignore Enter on a URL that does not parse', () => {
        const onDismiss = vi.fn();
        renderMenu([], onDismiss);
        fireEvent.change(screen.getByTestId('cluster-url-input'), { target: { value: 'not a url' } });
        fireEvent.keyDown(screen.getByTestId('cluster-url-input'), { key: 'Enter' });

        expect(nav.replace).not.toHaveBeenCalled();
        expect(onDismiss).not.toHaveBeenCalled();
    });

    it('should block saving a URL that is already saved', () => {
        renderMenu([{ name: 'Mine', url: NEW_URL }]);
        fireEvent.change(screen.getByTestId('cluster-url-input'), { target: { value: NEW_URL } });
        const save = screen.getByTestId('open-save-cluster-btn');
        expect(save).toBeDisabled();
        expect(save).toHaveTextContent('Saved');
    });

    it('should keep an API key in the URL off the save form', () => {
        renderMenu();
        fireEvent.change(screen.getByTestId('cluster-url-input'), {
            target: { value: 'https://rpc.example/?api-key=secret' },
        });
        fireEvent.click(screen.getByTestId('open-save-cluster-btn'));

        expect(screen.getByTestId('save-cluster-host').textContent).toBe('rpc.example');
        expect(screen.getByTestId('save-cluster-form')).not.toHaveTextContent('secret');
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

describe('ClusterMenu trust toggle', () => {
    it.each([
        ['declined', 'consent-cancel', false],
        ['confirmed', 'consent-confirm', true],
    ])('should trust any RPC server only once the prompt is confirmed (%s)', (_label, answer, trusted) => {
        const { store } = renderMenu();
        fireEvent.click(screen.getByRole('switch'));

        expect(screen.getByTestId('custom-url-consent')).toBeInTheDocument();
        expect(store.get(customUrlEnabledAtom)).toBe(false);

        fireEvent.click(screen.getByTestId(answer));
        expect(store.get(customUrlEnabledAtom)).toBe(trusted);
    });
});
