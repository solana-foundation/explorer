import { Cluster } from '@/app/utils/cluster';

import { parseClusterId, type QueryCluster } from './cluster';

export type CompositeSignature = {
    signature: string;
    version?: string;
    cluster?: QueryCluster;
};

export function parseCompositeSignature(composite: string): CompositeSignature {
    // Format: {signature} or {signature}-{version} or {signature}-{version}-{clusterId}
    // Signature is base58, doesn't contain '-'
    const parts = composite.split('-');

    if (parts.length === 1) {
        return { signature: parts[0] };
    }

    if (parts.length === 2) {
        return { signature: parts[0], version: parts[1] };
    }

    // 3+ parts: signature-version-clusterId
    return {
        cluster: parseClusterId(parts[2]),
        signature: parts[0],
        version: parts[1],
    };
}

export function buildCompositeSignature(signature: string, version?: string, cluster?: Cluster): string {
    const parts = [signature];

    if (version) {
        parts.push(version);
    }

    if (cluster !== undefined && cluster !== Cluster.MainnetBeta) {
        if (!version) parts.push(''); // placeholder for version
        parts.push(String(cluster));
    }

    return parts.join('-');
}
