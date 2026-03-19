import type { SavedCluster } from '@features/custom-cluster';
import { savedClustersAtom } from '@features/custom-cluster';
import { fireEvent, render, screen } from '@testing-library/react';
import { createStore, Provider } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Cluster, ClusterStatus } from '@/app/utils/cluster';

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
    return {
        store,
        ...render(
            <Provider store={store}>
                <ClusterModal />
            </Provider>,
        ),
    };
}

describe('ClusterModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    it('should render the cluster modal with built-in clusters', () => {
        renderWithStore();
        expect(screen.getByText('Choose a Cluster')).toBeInTheDocument();
        expect(screen.getByText('Mainnet Beta')).toBeInTheDocument();
        expect(screen.getByText('Testnet')).toBeInTheDocument();
        expect(screen.getByText('Devnet')).toBeInTheDocument();
        expect(screen.getByText('Custom RPC URL')).toBeInTheDocument();
    });

    it('should show save button when custom cluster is active', () => {
        renderWithStore();
        expect(screen.getByTestId('save-custom-cluster-btn')).toBeInTheDocument();
    });

    it('should hide save button when URL is already saved', () => {
        renderWithStore([{ name: 'My Local', url: 'http://localhost:8899' }]);
        expect(screen.queryByTestId('save-custom-cluster-btn')).not.toBeInTheDocument();
    });

    it('should show name input after clicking Save this cluster', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        expect(screen.getByTestId('cluster-name-input')).toBeInTheDocument();
        expect(screen.getByTestId('name-required-hint')).toBeInTheDocument();
    });

    it('should save a custom cluster', () => {
        const { store } = renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: 'My Local' } });
        fireEvent.click(screen.getByTestId('confirm-save-cluster-btn'));
        expect(store.get(savedClustersAtom)).toEqual([{ name: 'My Local', url: 'http://localhost:8899' }]);
    });

    it('should trim whitespace from cluster name on save', () => {
        const { store } = renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: '  Padded  ' } });
        fireEvent.click(screen.getByTestId('confirm-save-cluster-btn'));
        expect(store.get(savedClustersAtom)).toEqual([{ name: 'Padded', url: 'http://localhost:8899' }]);
    });

    it('should not save when name is empty', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        expect(screen.getByTestId('confirm-save-cluster-btn')).toBeDisabled();
    });

    it('should not save when name is whitespace only', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: '   ' } });
        expect(screen.getByTestId('confirm-save-cluster-btn')).toBeDisabled();
    });

    it('should hide save form and clear name on cancel', () => {
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: 'Draft' } });
        fireEvent.click(screen.getByText('Cancel'));
        expect(screen.queryByTestId('save-cluster-form')).not.toBeInTheDocument();
        expect(screen.getByTestId('save-custom-cluster-btn')).toBeInTheDocument();
    });

    it('should display saved clusters', () => {
        renderWithStore([
            { name: 'My Local', url: 'http://localhost:8899' },
            { name: 'Staging', url: 'http://staging.example.com' },
        ]);
        expect(screen.getByTestId('saved-clusters-section')).toBeInTheDocument();
        expect(screen.getByText('My Local')).toBeInTheDocument();
        expect(screen.getByText('Staging')).toBeInTheDocument();
    });

    it('should not render saved clusters section when empty', () => {
        renderWithStore();
        expect(screen.queryByTestId('saved-clusters-section')).not.toBeInTheDocument();
    });

    it('should delete a saved cluster', () => {
        const { store } = renderWithStore([
            { name: 'My Local', url: 'http://localhost:8899' },
            { name: 'Staging', url: 'http://staging.example.com' },
        ]);
        fireEvent.click(screen.getByTestId('delete-cluster-My Local'));
        expect(store.get(savedClustersAtom)).toEqual([{ name: 'Staging', url: 'http://staging.example.com' }]);
    });

    it('should show an error when storage quota is exceeded', () => {
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new DOMException('QuotaExceededError', 'QuotaExceededError');
        });
        renderWithStore();
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: 'My Local' } });
        fireEvent.click(screen.getByTestId('confirm-save-cluster-btn'));
        expect(screen.getByTestId('save-cluster-error')).toBeInTheDocument();
        setItemSpy.mockRestore();
    });

    it('should show save button again after deleting the cluster with matching URL', () => {
        renderWithStore([{ name: 'My Local', url: 'http://localhost:8899' }]);
        expect(screen.queryByTestId('save-custom-cluster-btn')).not.toBeInTheDocument();
        fireEvent.click(screen.getByTestId('delete-cluster-My Local'));
        expect(screen.getByTestId('save-custom-cluster-btn')).toBeInTheDocument();
    });
});
