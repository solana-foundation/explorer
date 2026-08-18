'use client';

import { Overlay } from '@components/common/Overlay';
import { cn } from '@components/shared/utils';
import { useCluster, useClusterModal } from '@entities/cluster';
import { Cluster, clusterName, CLUSTERS, clusterSlug } from '@utils/cluster';
import { useAtomValue } from 'jotai';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// The slice's own model, so relative imports rather than its public `index.ts`, which would be a cycle.
import { savedClustersAtom } from '../lib/cluster-storage';
import { useClusterHref } from '../model/use-cluster-href';
import { clusterButtonVariants } from './cluster-button-variants';
import { CustomClusterField } from './CustomClusterField';
import { SavedClusterList } from './SavedClusterList';

const ClusterModalDeveloperSettings = dynamic(
    () => import('./ClusterModalDeveloperSettings').then(m => m.ClusterModalDeveloperSettings),
    { ssr: false },
);

export function ClusterModal() {
    const [show, setShow] = useClusterModal();
    const onClose = () => setShow(false);

    return (
        <>
            <div
                className={cn(
                    'fixed bottom-0 right-0 top-0 z-[1060] flex w-[350px] max-w-full flex-col border-0 border-l border-solid border-dk-black bg-dk-gray-800-dark transition-[transform,visibility] duration-300 ease-in-out',
                    show ? 'visible translate-x-0' : 'invisible translate-x-full',
                )}
            >
                {/* The panel is pinned `top-0 bottom-0`, so a short viewport or enough saved clusters runs
                    the content off the bottom edge with no way to reach it. `overflow-x-hidden` keeps it
                    to one axis: leaving x at `visible` computes it to `auto` next to a scrolling y axis,
                    adding a second scrollbar for pills that already truncate. `overscroll-contain` stops
                    the page behind the overlay from scrolling on once this reaches its end. */}
                <div
                    className="relative flex-auto overflow-y-auto overflow-x-hidden overscroll-contain p-6"
                    onClick={e => e.stopPropagation()}
                    data-testid="cluster-modal-body"
                >
                    <span className="cursor-pointer" onClick={onClose}>
                        &times;
                    </span>

                    <h2 className="mb-6 mt-6 text-center">Choose a Cluster</h2>
                    <ClusterToggle />
                    <ClusterModalDeveloperSettings />
                </div>
            </div>

            <div onClick={onClose}>
                <Overlay show={show} />
            </div>
        </>
    );
}

// The saved list is read once here and passed down, so its two consumers share one subscription and stay
// on the same value within a render.
function ClusterToggle() {
    const { status, cluster } = useCluster();
    const savedClusters = useAtomValue(savedClustersAtom);
    const buildHref = useClusterHref();

    return (
        <div className="mb-6 flex flex-wrap">
            {CLUSTERS.map(net => {
                const active = net === cluster;
                if (net === Cluster.Custom)
                    return (
                        <CustomClusterField
                            key={clusterSlug(net)}
                            status={status}
                            active={active}
                            savedClusters={savedClusters}
                        />
                    );

                return (
                    <Link
                        key={clusterSlug(net)}
                        className={cn(clusterButtonVariants({ active, status }), 'mb-3')}
                        href={buildHref({ cluster: net })}
                    >
                        {clusterName(net)}
                    </Link>
                );
            })}
            <SavedClusterList status={status} savedClusters={savedClusters} />
        </div>
    );
}
