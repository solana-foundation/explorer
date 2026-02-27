import { fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster, ClusterStatus } from '@/app/utils/cluster';
import { persistedClusterAtom, savedClustersAtom } from '@features/custom-cluster';
import type { SavedCluster } from '@features/custom-cluster';

vi.mock('next/navigation', () => ({
    usePathname: () => '/',
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => new URLSearchParams('cluster=custom&customUrl=http://localhost:8899'),
}));

vi.mock('@/app/providers/cluster', () => ({
    useCluster: () => ({
        cluster: Cluster.Custom,
        customUrl: 'http://localhost:8899',
        status: ClusterStatus.Connected,
    }),
    useClusterModal: () => [true, vi.fn()],
    useUpdateCustomUrl: () => vi.fn(),
}));

vi.mock('./ClusterModalDeveloperSettings', () => ({
    default: () => null,
}));

// Must import after mocks
// eslint-disable-next-line simple-import-sort/imports
import { ClusterModal } from '../ClusterModal';

function renderWithStore(initialClusters: SavedCluster[] = []) {
    const store = createStore();
    if (initialClusters.length > 0) {
        store.set(savedClustersAtom, initialClusters);
    }
    return { store, ...render(<Provider store={store}><ClusterModal /></Provider>) };
}

describe('ClusterModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('renders the cluster modal with built-in clusters', () => {
        renderWithStore();
        expect(screen.getByText('Choose a Cluster')).toBeInTheDocument();
        expect(screen.getByText('Mainnet Beta')).toBeInTheDocument();
        expect(screen.getByText('Testnet')).toBeInTheDocument();
        expect(screen.getByText('Devnet')).toBeInTheDocument();
        expect(screen.getByText('Custom RPC URL')).toBeInTheDocument();
    });

    it('shows save button when custom cluster is active', () => {
        renderWithStore();
        expect(screen.getByTestId('save-custom-cluster-btn')).toBeInTheDocument();
    });

    it('hides save button when URL is already saved', () => {
        renderWithStore([{ name: 'My Local', url: 'http://localhost:8899' }]);
        expect(screen.queryByTestId('save-custom-cluster-btn')).not.toBeInTheDocument();
    });

    it('shows name input after clicking Save this cluster', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        expect(screen.getByTestId('cluster-name-input')).toBeInTheDocument();
        expect(screen.getByTestId('name-required-hint')).toBeInTheDocument();
    });

    it('saves a custom cluster and persists the selection', () => {
        const { store } = renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: 'My Local' } });
        fireEvent.click(screen.getByTestId('confirm-save-cluster-btn'));
        expect(store.get(savedClustersAtom)).toEqual([{ name: 'My Local', url: 'http://localhost:8899' }]);
        expect(store.get(persistedClusterAtom)).toBe('custom:My Local');
    });

    it('trims whitespace from cluster name on save', () => {
        const { store } = renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: '  Padded  ' } });
        fireEvent.click(screen.getByTestId('confirm-save-cluster-btn'));
        expect(store.get(savedClustersAtom)).toEqual([{ name: 'Padded', url: 'http://localhost:8899' }]);
    });

    it('does not save when name is empty', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        expect(screen.getByTestId('confirm-save-cluster-btn')).toBeDisabled();
    });

    it('does not save when name is whitespace only', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: '   ' } });
        expect(screen.getByTestId('confirm-save-cluster-btn')).toBeDisabled();
    });

    it('hides save form and clears name on cancel', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: 'Draft' } });
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByTestId('save-cluster-form')).not.toBeInTheDocument();
        expect(screen.getByTestId('save-custom-cluster-btn')).toBeInTheDocument();
    });

    it('displays saved clusters', () => {
        renderWithStore([
            { name: 'My Local', url: 'http://localhost:8899' },
            { name: 'Staging', url: 'http://staging.example.com' },
        ]);
        expect(screen.getByTestId('saved-clusters-section')).toBeInTheDocument();
        expect(screen.getByText('My Local')).toBeInTheDocument();
        expect(screen.getByText('Staging')).toBeInTheDocument();
    });

    it('does not render saved clusters section when empty', () => {
        renderWithStore();
        expect(screen.queryByTestId('saved-clusters-section')).not.toBeInTheDocument();
    });

    it('deletes a saved cluster', () => {
        const { store } = renderWithStore([
            { name: 'My Local', url: 'http://localhost:8899' },
            { name: 'Staging', url: 'http://staging.example.com' },
        ]);
        fireEvent.click(screen.getByTestId('delete-cluster-My Local'));
        expect(store.get(savedClustersAtom)).toEqual([{ name: 'Staging', url: 'http://staging.example.com' }]);
    });

    it('shows save button again after deleting the cluster with matching URL', () => {
        renderWithStore([{ name: 'My Local', url: 'http://localhost:8899' }]);
        expect(screen.queryByTestId('save-custom-cluster-btn')).not.toBeInTheDocument();
        fireEvent.click(screen.getByTestId('delete-cluster-My Local'));
        expect(screen.getByTestId('save-custom-cluster-btn')).toBeInTheDocument();
    });
});
