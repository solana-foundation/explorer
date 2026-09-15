'use client';

import { useCluster } from '@providers/cluster';

import { useAlpenglowStatus } from '../model/use-alpenglow-status';
import { BaseAlpenglowCard } from './BaseAlpenglowCard';

/**
 * Renders nothing until a node has answered, and nothing at all where one cannot: an endpoint that
 * predates the method has no migration to report, so a skeleton there would promise a card that
 * never arrives.
 */
export function AlpenglowCard() {
    const { cluster } = useCluster();
    const status = useAlpenglowStatus();

    if (status.kind === 'loading' || status.kind === 'unavailable') return undefined;

    return <BaseAlpenglowCard cluster={cluster} upgrade={status} />;
}
