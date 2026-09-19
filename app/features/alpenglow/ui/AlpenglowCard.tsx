'use client';

import { useCluster } from '@providers/cluster';

import { useAlpenglowStatus } from '../model/use-alpenglow-status';
import { BaseAlpenglowCard } from './BaseAlpenglowCard';

/**
 * Renders nothing until the first response, and nothing at all where the endpoint lacks the method.
 *
 * An endpoint without the method has no migration to report, so no card ever arrives and a
 * skeleton would mislead.
 */
export function AlpenglowCard() {
    const { cluster } = useCluster();
    const status = useAlpenglowStatus();

    if (status.kind === 'loading' || status.kind === 'unavailable') return undefined;

    return <BaseAlpenglowCard cluster={cluster} upgrade={status} />;
}
