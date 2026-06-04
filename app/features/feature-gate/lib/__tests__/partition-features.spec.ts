import { type FeatureInfoType } from '@entities/feature-gate';
import { vi } from 'vitest';

import { Cluster } from '@/app/utils/cluster';

// `key` is loosened to a plain string so tests can use readable sentinels
// ('A', 'IDLE', …); it's branded to `FeatureInfoType['key']` (kit's `Address`)
// once here rather than at every call site. partitionFeatures never parses the
// key, so the sentinels are fine.
function makeFeature(overrides: Partial<Omit<FeatureInfoType, 'key'>> & { key?: string }): FeatureInfoType {
    const { key = 'PLACEHOLDER', ...rest } = overrides;
    return {
        comms_required: null,
        description: '',
        devnet_activation_epoch: null,
        key: key as FeatureInfoType['key'],
        mainnet_activation_epoch: null,
        min_agave_versions: [],
        min_fd_versions: [],
        min_jito_versions: [],
        owners: [],
        planned_testnet_order: null,
        simd_link: [],
        simds: [],
        testnet_activation_epoch: null,
        title: 'placeholder',
        ...rest,
    };
}

async function importWith(features: FeatureInfoType[]) {
    vi.resetModules();
    vi.doMock('@entities/feature-gate', () => ({
        FEATURE_GATES: features,
    }));
    return (await import('../partition-features')).partitionFeatures;
}

describe('partitionFeatures', () => {
    it('should put features active on the given cluster into "activated"', async () => {
        const partition = await importWith([
            makeFeature({ key: 'A', mainnet_activation_epoch: 800, title: 'A' }),
            makeFeature({ key: 'IDLE', title: 'IDLE' }),
        ]);
        const { activated, upcoming } = partition(Cluster.MainnetBeta);
        expect(activated.map(feature => feature.key)).toEqual(['A']);
        expect(activated[0]).toMatchObject({ clusterActivationEpoch: 800 });
        expect(upcoming).toHaveLength(0);
    });

    it('should put features active elsewhere but not here into "upcoming", sorted by devnet epoch ascending', async () => {
        const partition = await importWith([
            makeFeature({ devnet_activation_epoch: 1050, key: 'B', testnet_activation_epoch: 1000 }),
            makeFeature({ devnet_activation_epoch: 950, key: 'A', testnet_activation_epoch: 900 }),
        ]);
        const { activated, upcoming } = partition(Cluster.MainnetBeta);
        expect(activated).toHaveLength(0);
        // A has a lower devnet epoch (950) than B (1050), so A comes first.
        expect(upcoming.map(feature => feature.key)).toEqual(['A', 'B']);
        expect(upcoming[0].otherActivations).toEqual([
            { cluster: Cluster.Devnet, epoch: 950 },
            { cluster: Cluster.Testnet, epoch: 900 },
        ]);
    });

    it('should record other-cluster activations on a feature that is also activated on the given cluster', async () => {
        const partition = await importWith([
            makeFeature({
                devnet_activation_epoch: 780,
                key: 'A',
                mainnet_activation_epoch: 800,
                testnet_activation_epoch: 760,
            }),
        ]);
        const { activated, upcoming } = partition(Cluster.MainnetBeta);
        expect(upcoming).toHaveLength(0);
        expect(activated[0]).toMatchObject({ clusterActivationEpoch: 800, key: 'A' });
        expect(activated[0].otherActivations).toEqual([
            { cluster: Cluster.Devnet, epoch: 780 },
            { cluster: Cluster.Testnet, epoch: 760 },
        ]);
    });

    it('should pair simds with simd_link entries and drop entries missing either side', async () => {
        const partition = await importWith([
            makeFeature({
                key: 'A',
                mainnet_activation_epoch: 800,
                simd_link: ['https://simd/148', '', 'https://simd/200'],
                simds: ['148', '149', '200'],
            }),
        ]);
        const { activated } = partition(Cluster.MainnetBeta);
        expect(activated[0].simdEntries).toEqual([
            { link: 'https://simd/148', simd: '148' },
            { link: 'https://simd/200', simd: '200' },
        ]);
    });

    it('should drop pairs where simds is shorter than simd_link, and vice versa', async () => {
        const partition = await importWith([
            makeFeature({
                key: 'A',
                mainnet_activation_epoch: 800,
                simd_link: ['https://simd/148', 'https://simd/extra'],
                simds: ['148'],
            }),
            makeFeature({
                key: 'B',
                mainnet_activation_epoch: 800,
                simd_link: [],
                simds: ['200'],
            }),
        ]);
        const { activated } = partition(Cluster.MainnetBeta);
        const byKey = Object.fromEntries(activated.map(f => [f.key, f.simdEntries]));
        expect(byKey['A']).toEqual([{ link: 'https://simd/148', simd: '148' }]);
        expect(byKey['B']).toEqual([]);
    });

    it('should not expose the raw simds / simd_link arrays on enriched features', async () => {
        const partition = await importWith([
            makeFeature({ key: 'A', mainnet_activation_epoch: 800, simd_link: ['x'], simds: ['148'] }),
        ]);
        const { activated } = partition(Cluster.MainnetBeta);
        expect('simds' in activated[0]).toBe(false);
        expect('simd_link' in activated[0]).toBe(false);
    });

    it('should ignore features that are not active anywhere', async () => {
        const partition = await importWith([makeFeature({ key: 'IDLE' })]);
        const { activated, upcoming } = partition(Cluster.MainnetBeta);
        expect(activated).toHaveLength(0);
        expect(upcoming).toHaveLength(0);
    });

    it('should return empty partitions for a custom cluster', async () => {
        const partition = await importWith([makeFeature({ key: 'A', mainnet_activation_epoch: 800 })]);
        const { activated, upcoming } = partition(Cluster.Custom);
        expect(activated).toHaveLength(0);
        expect(upcoming).toHaveLength(0);
    });
});
