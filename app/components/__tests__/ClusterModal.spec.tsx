import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { addSavedCluster, getSavedClusters, removeSavedCluster } from '@/app/utils/cluster-storage';

vi.mock('next/navigation', () => ({
    usePathname: () => '/',
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => new URLSearchParams('cluster=custom&customUrl=http://localhost:8899'),
}));

vi.mock('@/app/providers/cluster', () => ({
    useCluster: () => ({
        cluster: 4, // Cluster.Custom
        customUrl: 'http://localhost:8899',
        status: 0, // ClusterStatus.Connected
    }),
    useClusterModal: () => [true, vi.fn()],
    useUpdateCustomUrl: () => vi.fn(),
}));

vi.mock('@/app/utils/cluster-storage', () => ({
    addSavedCluster: vi.fn(),
    getSavedClusters: vi.fn(() => []),
    removeSavedCluster: vi.fn(),
    setPersistedCluster: vi.fn(),
}));

vi.mock('./ClusterModalDeveloperSettings', () => ({
    default: () => null,
}));

// Must import after mocks
// eslint-disable-next-line simple-import-sort/imports
import { ClusterModal } from '../ClusterModal';

describe('ClusterModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getSavedClusters).mockReturnValue([]);
    });

    it('renders the cluster modal with built-in clusters', () => {
        render(<ClusterModal />);
        expect(screen.getByText('Choose a Cluster')).toBeInTheDocument();
        expect(screen.getByText('Mainnet Beta')).toBeInTheDocument();
        expect(screen.getByText('Testnet')).toBeInTheDocument();
        expect(screen.getByText('Devnet')).toBeInTheDocument();
        expect(screen.getByText('Custom RPC URL')).toBeInTheDocument();
    });

    it('shows save button when custom cluster is active', () => {
        render(<ClusterModal />);
        expect(screen.getByTestId('save-custom-cluster-btn')).toBeInTheDocument();
    });

    it('shows name input after clicking Save this cluster', () => {
        render(<ClusterModal />);
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        expect(screen.getByTestId('cluster-name-input')).toBeInTheDocument();
        expect(screen.getByTestId('name-required-hint')).toBeInTheDocument();
    });

    it('saves a custom cluster with a name', () => {
        render(<ClusterModal />);
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        fireEvent.change(screen.getByTestId('cluster-name-input'), { target: { value: 'My Local' } });
        fireEvent.click(screen.getByTestId('confirm-save-cluster-btn'));
        expect(addSavedCluster).toHaveBeenCalledWith({ name: 'My Local', url: 'http://localhost:8899' });
    });

    it('does not save when name is empty', () => {
        render(<ClusterModal />);
        fireEvent.click(screen.getByTestId('save-custom-cluster-btn'));
        expect(screen.getByTestId('confirm-save-cluster-btn')).toBeDisabled();
    });

    it('displays saved clusters', () => {
        vi.mocked(getSavedClusters).mockReturnValue([
            { name: 'My Local', url: 'http://localhost:8899' },
            { name: 'Staging', url: 'http://staging.example.com' },
        ]);
        render(<ClusterModal />);
        expect(screen.getByTestId('saved-clusters-section')).toBeInTheDocument();
        expect(screen.getByText('My Local')).toBeInTheDocument();
        expect(screen.getByText('Staging')).toBeInTheDocument();
    });

    it('does not render saved clusters section when empty', () => {
        vi.mocked(getSavedClusters).mockReturnValue([]);
        render(<ClusterModal />);
        expect(screen.queryByTestId('saved-clusters-section')).not.toBeInTheDocument();
    });

    it('deletes a saved cluster', () => {
        vi.mocked(getSavedClusters)
            .mockReturnValueOnce([
                { name: 'My Local', url: 'http://localhost:8899' },
                { name: 'Staging', url: 'http://staging.example.com' },
            ])
            .mockReturnValueOnce([{ name: 'Staging', url: 'http://staging.example.com' }]);

        render(<ClusterModal />);
        fireEvent.click(screen.getByTestId('delete-cluster-My Local'));
        expect(removeSavedCluster).toHaveBeenCalledWith('My Local');
    });
});
