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

// The endpoints the user has kept under a name. Deleting one is the only control here that has to think
// about the page it leaves behind.
export function SavedClusterList({ savedClusters, status }: SavedClusterListProps) {
    const { endpoint, cluster } = useCluster();
    const removeSavedCluster = useSetAtom(removeSavedClusterAtom);
    const buildHref = useClusterHref();
    const router = useRouter();

    const handleDelete = (name: string) => {
        const activeUrl = endpoint?.href;
        const wasActive = cluster === Cluster.Custom && savedClusters.find(c => c.name === name)?.url === activeUrl;
        removeSavedCluster(name);
        // Deleting the entry the page is pointed at leaves an endpoint with no home, so fall back to the
        // default cluster — unless another entry still names the same URL.
        const stillSaved = savedClusters.some(c => c.name !== name && c.url === activeUrl);
        if (wasActive && !stillSaved) {
            router.push(buildHref({ cluster: DEFAULT_CLUSTER, customUrl: '' }));
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
    onDelete: (name: string) => void;
};

function SavedClusterItem({ saved, status, isActive, onDelete }: SavedClusterItemProps) {
    const buildHref = useClusterHref();
    const approveOrigin = useSetAtom(approveRpcOriginAtom);

    // `parseSavedClusters` already refuses non-endpoints at the storage boundary, so this is `undefined`
    // only if that check is ever loosened — not a state the UI can reach today.
    const savedEndpoint = parseRpcEndpoint(saved.url);

    // Picking a saved cluster is a first-party action, so approve before the navigation lands. Otherwise
    // the reader treats the user's own saved endpoint as an unvetted inbound one and prompts for it.
    const onSelect = () => {
        if (savedEndpoint !== undefined) approveOrigin(savedEndpoint);
    };

    return (
        <div className="relative mb-3 w-full" data-testid={`saved-cluster-${saved.name}`}>
            {/* `pl-10 pr-10` rather than `px-10`: cn is clsx-only, and Tailwind emits pl/pr after px, so
                this is what actually beats the size compound's `px-3`. Symmetric so short names stay
                centered; 40px clears the 36px delete button.

                The host gets a line of its own because clicking a saved cluster *is* the commit — a name
                alone cannot tell a stale entry from a good one, or two entries apart. Host rather than
                `href`: provider endpoints carry the API key in the path or query, and this panel gets
                opened during screen shares. The whole URL stays in `title`. Dropped when the name is
                already the host, rather than printing one string twice. */}
            <Link
                className={cn(clusterButtonVariants({ active: isActive, status }), 'pl-10 pr-10 text-center')}
                href={buildHref({ cluster: Cluster.Custom, customUrl: saved.url })}
                onClick={onSelect}
                title={`${saved.name} — ${saved.url}`}
                data-testid={`saved-cluster-link-${saved.name}`}
            >
                {/* Two `block` spans rather than `flex flex-col`: the dashkit base sets `inline-block`,
                    and cn is clsx-only, so a display override would ride on Tailwind's emission order.
                    `text-dk-gray-700` sits on the child so it beats the active compound's status color,
                    keeping the host as fine print whether or not this entry is selected. */}
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
            {/* `variant` is not optional here, whatever the prop type says: the dashkit default emits no
                bg/border/text, and styles.css reverts bare buttons to UA chrome — a light grey box on the
                dark pill. `outline-danger` is the app's destructive treatment, kept for its danger color
                with the outline dropped. `border-transparent` rather than `border-0` keeps the 1px box, so
                nothing shifts. Important, like `!text-[11px]` in button.tsx: cn is clsx-only, so this has
                to beat both the variant's `border-[#b45be1]` and its `hover:border-*` regardless of
                emission order. The hover fill stays as the only remaining hover cue. */}
            <Button
                ui="dashkit"
                variant="outline-danger"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 !border-transparent"
                onClick={e => {
                    e.stopPropagation();
                    onDelete(saved.name);
                }}
                data-testid={`delete-cluster-${saved.name}`}
                aria-label={`Delete ${saved.name}`}
            >
                <Trash2 size={14} />
            </Button>
        </div>
    );
}
