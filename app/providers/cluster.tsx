'use client';

// The cluster provider lives in the `cluster` FSD entity as a router-agnostic component. Binding it to
// Next.js navigation is app-layer work in FSD, and `app/providers/` currently serves as this repo's app
// layer — so that wiring lives here. This module also re-exports the rest of the entity's public API so
// the ~130 existing `@providers/cluster` import sites keep working unchanged.
import { ClusterProvider as ClusterStateProvider } from '@entities/cluster';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { type ReactNode, useCallback } from 'react';

export function ClusterProvider({ children }: { children: ReactNode }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();

    const onReplaceSearchParams = useCallback(
        (next: URLSearchParams) => {
            const queryString = next.toString();
            router.push(`${pathname}${queryString ? `?${queryString}` : ''}`);
        },
        [pathname, router],
    );

    return (
        <ClusterStateProvider searchParams={searchParams} onReplaceSearchParams={onReplaceSearchParams}>
            {children}
        </ClusterStateProvider>
    );
}

export {
    type ClusterInfo,
    type ClusterState,
    clusterModalOpenAtom,
    customUrlEnabledAtom,
    StateContext,
    useCluster,
    useClusterInfo,
    useClusterModal,
    useUpdateCustomUrl,
} from '@entities/cluster';
