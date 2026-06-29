import { Cluster } from '@/app/utils/cluster';

import { filterUpcomingForCluster } from '../filter-upcoming-features';
import { type UpcomingFeature } from '../partition-features';

function makeUpcoming(overrides: Partial<Omit<UpcomingFeature, 'key'>> & { key?: string }): UpcomingFeature {
    const { key = 'PLACEHOLDER', ...rest } = overrides;
    return {
        comms_required: null,
        description: '',
        devnet_activation_epoch: null,
        key: key as UpcomingFeature['key'],
        mainnet_activation_epoch: null,
        min_agave_versions: [],
        min_fd_versions: [],
        min_jito_versions: [],
        otherActivations: [],
        owners: [],
        planned_testnet_order: null,
        simdEntries: [],
        testnet_activation_epoch: null,
        title: 'placeholder',
        ...rest,
    };
}

describe('filterUpcomingForCluster', () => {
    describe('MainnetBeta', () => {
        it('should include features active on both devnet and testnet', () => {
            const feature = makeUpcoming({ devnet_activation_epoch: 950, key: 'A', testnet_activation_epoch: 900 });
            expect(filterUpcomingForCluster([feature], Cluster.MainnetBeta)).toHaveLength(1);
        });

        it('should exclude features active only on devnet', () => {
            const feature = makeUpcoming({ devnet_activation_epoch: 950, key: 'A', testnet_activation_epoch: null });
            expect(filterUpcomingForCluster([feature], Cluster.MainnetBeta)).toHaveLength(0);
        });

        it('should exclude features active only on testnet', () => {
            const feature = makeUpcoming({ devnet_activation_epoch: null, key: 'A', testnet_activation_epoch: 900 });
            expect(filterUpcomingForCluster([feature], Cluster.MainnetBeta)).toHaveLength(0);
        });

        it('should exclude features active on neither devnet nor testnet', () => {
            const feature = makeUpcoming({ key: 'A' });
            expect(filterUpcomingForCluster([feature], Cluster.MainnetBeta)).toHaveLength(0);
        });
    });

    describe('Devnet', () => {
        it('should include features active on testnet but not on mainnet', () => {
            const feature = makeUpcoming({ key: 'A', mainnet_activation_epoch: null, testnet_activation_epoch: 900 });
            expect(filterUpcomingForCluster([feature], Cluster.Devnet)).toHaveLength(1);
        });

        it('should exclude features not yet active on testnet', () => {
            const feature = makeUpcoming({ key: 'A', testnet_activation_epoch: null });
            expect(filterUpcomingForCluster([feature], Cluster.Devnet)).toHaveLength(0);
        });

        it('should exclude features that are already on mainnet', () => {
            const feature = makeUpcoming({
                key: 'A',
                mainnet_activation_epoch: 1000,
                testnet_activation_epoch: 900,
            });
            expect(filterUpcomingForCluster([feature], Cluster.Devnet)).toHaveLength(0);
        });
    });

    describe('Testnet', () => {
        it('should include features with no testnet activation epoch', () => {
            const feature = makeUpcoming({ key: 'A', testnet_activation_epoch: null });
            expect(filterUpcomingForCluster([feature], Cluster.Testnet)).toHaveLength(1);
        });

        it('should exclude features that have a testnet activation epoch', () => {
            const feature = makeUpcoming({ key: 'A', testnet_activation_epoch: 900 });
            expect(filterUpcomingForCluster([feature], Cluster.Testnet)).toHaveLength(0);
        });
    });

    describe('Custom', () => {
        it('should exclude all features', () => {
            const feature = makeUpcoming({
                devnet_activation_epoch: 950,
                key: 'A',
                testnet_activation_epoch: 900,
            });
            expect(filterUpcomingForCluster([feature], Cluster.Custom)).toHaveLength(0);
        });
    });
});
