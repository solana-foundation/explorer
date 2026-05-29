import { FEATURE_GATES, type FeatureInfoType } from '@entities/feature-gate';

import { Cluster } from '@/app/utils/cluster';

export type ClusterActivation = { cluster: Cluster; epoch: number };
export type SimdEntry = { simd: string; link: string };

type EnrichedBase = Omit<FeatureInfoType, 'simds' | 'simd_link'> & {
    simdEntries: SimdEntry[];
    otherActivations: ClusterActivation[];
};

export type ActivatedFeature = EnrichedBase & { clusterActivationEpoch: number };
export type UpcomingFeature = EnrichedBase;

export type FeaturePartition = {
    activated: ActivatedFeature[];
    upcoming: UpcomingFeature[];
};

const OTHER_CLUSTERS: Partial<Record<Cluster, Cluster[]>> = {
    [Cluster.Devnet]: [Cluster.MainnetBeta, Cluster.Testnet],
    [Cluster.MainnetBeta]: [Cluster.Devnet, Cluster.Testnet],
    [Cluster.Testnet]: [Cluster.MainnetBeta, Cluster.Devnet],
};

/**
 * Split the static feature list into "already activated on the given cluster"
 * and "active elsewhere but not yet here". Pure — safe to call from a memo.
 */
export function partitionFeatures(cluster: Cluster): FeaturePartition {
    const others = OTHER_CLUSTERS[cluster] ?? [];
    const activated: ActivatedFeature[] = [];
    const upcoming: UpcomingFeature[] = [];

    for (const feature of FEATURE_GATES as FeatureInfoType[]) {
        const epoch = activationEpochFor(feature, cluster);
        const otherActivations = others
            .map(other => {
                const otherEpoch = activationEpochFor(feature, other);
                return otherEpoch !== undefined ? { cluster: other, epoch: otherEpoch } : undefined;
            })
            .filter((entry): entry is ClusterActivation => entry !== undefined);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- drop the raw simd arrays; UI consumes simdEntries
        const { simds: _simds, simd_link: _simdLink, ...rest } = feature;
        const base: EnrichedBase = {
            ...rest,
            otherActivations,
            simdEntries: pairSimdLinks(feature.simds, feature.simd_link),
        };

        if (epoch !== undefined) activated.push({ ...base, clusterActivationEpoch: epoch });
        else if (otherActivations.length > 0) upcoming.push(base);
    }

    activated.sort((a, b) => b.clusterActivationEpoch - a.clusterActivationEpoch);
    // Features roll out testnet → devnet → mainnet, so the one whose latest
    // cross-cluster activation happened longest ago has baked the longest and is
    // next in line here. Sort ascending by that epoch so "to be activated soon" is first.
    upcoming.sort((a, b) => maxEpoch(a.otherActivations) - maxEpoch(b.otherActivations));

    return { activated, upcoming };
}

function activationEpochFor(feature: FeatureInfoType, cluster: Cluster): number | undefined {
    const raw = (() => {
        switch (cluster) {
            case Cluster.MainnetBeta:
                return feature.mainnet_activation_epoch;
            case Cluster.Devnet:
                return feature.devnet_activation_epoch;
            case Cluster.Testnet:
                return feature.testnet_activation_epoch;
            default:
                return undefined;
        }
    })();
    if (raw === null) return undefined;
    return Number.isFinite(raw) ? raw : undefined;
}

function maxEpoch(entries: ClusterActivation[]): number {
    return entries.reduce((max, entry) => Math.max(max, entry.epoch), 0);
}

// Zip the JSON's parallel arrays into typed pairs and drop entries with no link.
// Keeping this transformation here means UI components never index-zip the raw arrays themselves.
function pairSimdLinks(simds: string[], links: string[]): SimdEntry[] {
    const out: SimdEntry[] = [];
    for (const [index, simd] of simds.entries()) {
        const link = links[index];
        if (simd && link) out.push({ link, simd });
    }
    return out;
}
