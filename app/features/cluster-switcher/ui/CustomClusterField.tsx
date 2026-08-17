'use client';

import { Input } from '@components/shared/ui/input';
import { cn } from '@components/shared/utils';
import { Cluster, ClusterStatus } from '@utils/cluster';
import Link from 'next/link';

import type { SavedCluster } from '../lib/cluster-storage';
import { useClusterHref } from '../model/use-cluster-href';
import { useCustomUrlDraft } from '../model/use-custom-url-draft';
import { clusterButtonVariants } from './cluster-button-variants';
import { SaveClusterForm } from './SaveClusterForm';

type CustomClusterFieldProps = { active: boolean; savedClusters: SavedCluster[]; status: ClusterStatus };

// The Custom cluster's entry in the switcher. `useCustomUrlDraft` owns everything about the endpoint
// field except its markup.
//
// The pill's href carries no endpoint, so re-selecting Custom keeps whatever the query string holds.
export function CustomClusterField({ active, savedClusters, status }: CustomClusterFieldProps) {
    const { onChange, value } = useCustomUrlDraft();
    const buildHref = useClusterHref();

    return (
        <>
            <Link
                className={cn(clusterButtonVariants({ active, status }), 'mb-3')}
                href={buildHref({ cluster: Cluster.Custom })}
            >
                Custom RPC URL
            </Link>
            {active && (
                <>
                    {/* `variant="dark"` is what this app uses on a dark surface — see HistoryFilterBar and
                        ArgumentInput — and it brings the focus ring the old field lacked. No className
                        override: `cn` is clsx-only, so a competing `text-*` would not beat the variant's
                        by class order, only by stylesheet order. */}
                    <Input
                        type="url"
                        variant="dark"
                        value={value}
                        aria-label="Custom RPC URL"
                        onChange={e => onChange(e.target.value)}
                    />
                    <SaveClusterForm url={value} savedClusters={savedClusters} />
                </>
            )}
        </>
    );
}
