'use client';

import { approveRpcOriginAtom, useCluster } from '@entities/cluster';
import { DEFAULT_CLUSTER } from '@utils/cluster';
import { useSetAtom } from 'jotai';
import { useRouter } from 'next/navigation';

import { useClusterHref } from '../model/use-cluster-href';
import { CustomUrlConsentDialog } from './CustomUrlConsentDialog';

// Asks about an endpoint a link supplied. Mounted app-wide rather than inside the switcher, because the
// question arrives with the page: the user has not opened anything yet, and nothing connects until they
// answer (see `ClusterProvider`).
export function PendingCustomUrlConsent() {
    const { pendingCustomUrl } = useCluster();
    const approveOrigin = useSetAtom(approveRpcOriginAtom);
    const buildHref = useClusterHref();
    const router = useRouter();

    // The dialog stays mounted with no request so it can animate closed, so this handler exists while
    // nothing is waiting. Unreachable then, but the guard keeps that structural.
    const onConfirm = () => {
        if (pendingCustomUrl !== undefined) approveOrigin(pendingCustomUrl);
    };

    // Declining falls back to the default cluster, so the visitor lands on a working Explorer rather than
    // a custom cluster pointed at nothing. `replace`, so a refused prompt does not sit in the back
    // history waiting to ask again.
    const onCancel = () => router.replace(buildHref({ cluster: DEFAULT_CLUSTER, customUrl: '' }));

    return (
        <CustomUrlConsentDialog
            request={pendingCustomUrl === undefined ? undefined : { endpoint: pendingCustomUrl, kind: 'endpoint' }}
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
}
