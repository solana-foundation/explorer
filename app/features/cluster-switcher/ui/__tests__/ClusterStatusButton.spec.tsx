import { render, screen } from '@testing-library/react';
import { Cluster, ClusterStatus } from '@utils/cluster';
import { describe, expect, it, vi } from 'vitest';

const clusterMock = vi.hoisted(() => ({
    cluster: 4 as Cluster, // Cluster.Custom — a literal, because `vi.hoisted` runs before imports.
    customUrl: 'http://localhost:8899',
    name: 'Custom',
    status: 0 as ClusterStatus, // ClusterStatus.Connected
}));

// Spread the real barrel so `clusterSelection` stays live; only the connection hook is stubbed. Building
// a real selection from the loose fields keeps a test from handing over a pairing the app cannot produce.
vi.mock('@entities/cluster', async importOriginal => {
    const actual = await importOriginal<typeof import('@entities/cluster')>();
    return {
        ...actual,
        useCluster: () => ({
            ...actual.clusterSelection(clusterMock.cluster, clusterMock.customUrl),
            name: clusterMock.name,
            status: clusterMock.status,
        }),
    };
});

// Must import after mocks

import { ClusterStatusButton } from '../ClusterStatusButton';

function renderButton(overrides: Partial<typeof clusterMock> = {}) {
    Object.assign(clusterMock, {
        cluster: Cluster.Custom,
        customUrl: 'http://localhost:8899',
        name: 'Custom',
        status: ClusterStatus.Connected,
        ...overrides,
    });
    const { container, unmount } = render(<ClusterStatusButton />);
    // `Button` renders with `asChild`, so the styled element is the child span, not a <button>.
    return { control: container.firstElementChild as HTMLElement, unmount };
}

describe('ClusterStatusButton', () => {
    describe('label', () => {
        it('should show scheme and host only, so an embedded key never reaches the navbar', () => {
            const { control } = renderButton({ customUrl: 'https://mainnet.helius-rpc.com/?api-key=SECRET' });

            expect(screen.getByText('https://mainnet.helius-rpc.com')).toBeInTheDocument();
            expect(control.textContent).not.toContain('SECRET');
        });

        it('should keep the port for a local endpoint, since that is what separates two validators', () => {
            renderButton({ customUrl: 'http://localhost:8900' });

            expect(screen.getByText('http://localhost:8900')).toBeInTheDocument();
        });

        // No test for an unparseable endpoint: it is an `RpcEndpoint`, so a bare `localhost:8899` is
        // refused at the boundary. See `resolve-cluster.spec.ts`, "should refuse a malformed candidate URL".

        it('should show the cluster name off the custom cluster', () => {
            renderButton({ cluster: Cluster.Devnet, name: 'Devnet' });

            expect(screen.getByText('Devnet')).toBeInTheDocument();
        });
    });

    describe('provenance', () => {
        // Colour carries provenance, the icon carries status. A remote endpoint stays marked for as long
        // as it is in use, which a one-time dialog cannot do.
        const amber = 'bg-[#e08214]';

        it('should mark a remote custom endpoint, connected or connecting', () => {
            for (const status of [ClusterStatus.Connected, ClusterStatus.Connecting]) {
                const { control, unmount } = renderButton({ customUrl: 'https://my-node.example/rpc', status });

                expect(control.className).toContain(amber);
                // Colour cannot be the only signal.
                expect(screen.getByText('Custom RPC endpoint.')).toBeInTheDocument();
                unmount();
            }
        });

        it('should not mark a local endpoint', () => {
            const { control } = renderButton({ customUrl: 'http://localhost:8899' });

            expect(control.className).not.toContain(amber);
            expect(screen.queryByText('Custom RPC endpoint.')).not.toBeInTheDocument();
        });

        it('should not mark a known cluster', () => {
            const { control } = renderButton({ cluster: Cluster.Devnet, name: 'Devnet' });

            expect(control.className).not.toContain(amber);
        });

        it('should leave a failed connection red, since that is the more urgent fact', () => {
            const { control } = renderButton({
                customUrl: 'https://my-node.example/rpc',
                status: ClusterStatus.Failure,
            });

            expect(control.className).not.toContain(amber);
        });
    });
});
