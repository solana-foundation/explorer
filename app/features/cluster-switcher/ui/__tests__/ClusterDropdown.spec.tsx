import { render, screen } from '@testing-library/react';
import { ClusterStatus } from '@utils/cluster';
import { createStore, Provider } from 'jotai';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// A remote endpoint whose secret lives in the query string: the navbar label must never expose it.
const REMOTE_WITH_KEY = 'https://staging.example.com/rpc?api-key=secret';
const LOCAL_URL = 'http://localhost:8899';

const clusterMock = vi.hoisted(() => ({ url: 'https://staging.example.com/rpc?api-key=secret' as string | undefined }));

vi.mock('@entities/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/cluster')>();
    return {
        ...actual,
        useCluster: () => ({
            endpoint: clusterMock.url === undefined ? undefined : actual.parseRpcEndpoint(clusterMock.url),
            name: 'Custom',
            status: ClusterStatus.Connected,
        }),
    };
});

// Must import after mocks

import { ClusterDropdown } from '../ClusterDropdown';
import { UNKNOWN_COLOUR } from '../provenance-mark';

const triggerName = (name: string) => name.startsWith('Cluster:');

function renderDropdown() {
    const store = createStore();
    return render(
        <Provider store={store}>
            <ClusterDropdown />
        </Provider>,
    );
}

describe('ClusterDropdown', () => {
    beforeEach(() => {
        clusterMock.url = REMOTE_WITH_KEY;
    });

    // The security contract the deleted ClusterStatusButton spec guarded: an embedded key never reaches
    // the always-visible navbar trigger.
    it('should label a remote endpoint with scheme and host only, never the query key', () => {
        renderDropdown();
        const trigger = screen.getByRole('button', { name: triggerName });
        expect(trigger).toHaveAttribute('aria-label', expect.stringContaining('https://staging.example.com'));
        expect(trigger).not.toHaveAttribute('aria-label', expect.stringContaining('secret'));
        expect(trigger).not.toHaveAttribute('aria-label', expect.stringContaining('api-key'));
        expect(screen.getByText('https://staging.example.com')).toBeInTheDocument();
    });

    it('should mark a remote, unvouched endpoint as unknown', () => {
        renderDropdown();
        expect(screen.getByText('https://staging.example.com')).toHaveStyle({ color: UNKNOWN_COLOUR });
    });

    it('should show a local endpoint in full and leave it unmarked', () => {
        clusterMock.url = LOCAL_URL;
        renderDropdown();
        const label = screen.getByText('http://localhost:8899');
        expect(label).toBeInTheDocument();
        expect(label).not.toHaveStyle({ color: UNKNOWN_COLOUR });
    });
});
