'use client';

import { Button } from '@components/shared/ui/button';
import { cn } from '@components/shared/utils';
import { approveRpcOriginAtom, parseRpcEndpoint, useCluster } from '@entities/cluster';
import { Cluster, ClusterStatus, DEFAULT_CLUSTER } from '@utils/cluster';
import { useSetAtom } from 'jotai';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'react-feather';

import { removeSavedClusterAtom, type SavedCluster } from '../lib/cluster-storage';
import { useClusterHref } from '../model/use-cluster-href';
import { clusterButtonVariants } from './cluster-button-variants';

type SavedClusterListProps = { savedClusters: SavedCluster[]; status: ClusterStatus };

export function SavedClusterList({ savedClusters, status }: SavedClusterListProps) {
    const { endpoint, cluster } = useCluster();
    const removeSavedCluster = useSetAtom(removeSavedClusterAtom);
    const buildHref = useClusterHref();
    const router = useRouter();

    const handleDelete = (url: string) => {
        const activeUrl = endpoint?.href;
        const wasActive = cluster === Cluster.Custom && url === activeUrl;
        removeSavedCluster(url);
        if (wasActive) {
            router.push(buildHref({ cluster: DEFAULT_CLUSTER, customUrl: '' }), { scroll: false });
        }
    };

    if (savedClusters.length === 0) return undefined;

    return (
        <div className="w-full" data-testid="saved-clusters-section">
            <hr />
            <h3 className="mb-3 text-center">Saved Clusters</h3>
            {savedClusters.map(saved => (
                <SavedClusterItem
                    key={saved.name}
                    saved={saved}
                    status={status}
                    isActive={cluster === Cluster.Custom && endpoint?.href === saved.url}
                    onDelete={handleDelete}
                />
            ))}
        </div>
    );
}

type SavedClusterItemProps = {
    saved: SavedCluster;
    status: ClusterStatus;
    isActive: boolean;
    onDelete: (url: string) => void;
};

function SavedClusterItem({ saved, status, isActive, onDelete }: SavedClusterItemProps) {
    const buildHref = useClusterHref();
    const approveOrigin = useSetAtom(approveRpcOriginAtom);

    const savedEndpoint = parseRpcEndpoint(saved.url);

    const onSelect = () => {
        if (savedEndpoint !== undefined) approveOrigin(savedEndpoint);
    };

    return (
        <div className="relative mb-3 w-full" data-testid={`saved-cluster-${saved.name}`}>
            <Link
                className={cn(clusterButtonVariants({ active: isActive, status }), 'pl-10 pr-10 text-center')}
                href={buildHref({ cluster: Cluster.Custom, customUrl: saved.url })}
                onClick={onSelect}
                title={`${saved.name} — ${saved.url}`}
                data-testid={`saved-cluster-link-${saved.name}`}
            >
                <span className="block truncate">{saved.name}</span>
                {savedEndpoint && savedEndpoint.host !== saved.name && (
                    <span
                        className="block truncate text-xs text-dk-gray-700"
                        data-testid={`saved-cluster-host-${saved.name}`}
                    >
                        {savedEndpoint.host}
                    </span>
                )}
            </Link>
            <Button
                ui="dashkit"
                variant="outline-danger"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 !border-transparent"
                onClick={e => {
                    e.stopPropagation();
                    onDelete(saved.url);
                }}
                data-testid={`delete-cluster-${saved.name}`}
                aria-label={`Delete ${saved.name}`}
            >
                <Trash2 size={14} />
            </Button>
        </div>
    );
}
